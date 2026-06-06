# Checkpoint 6 — Study Rooms → Supabase + Socket.IO Plan

> Scope: Move the five HTTP study-room endpoints (`GET /study-rooms`,
> `GET /study-rooms/:id`, `POST /study-rooms`, `POST /study-rooms/:id/join`,
> `POST /study-rooms/:id/leave`, `DELETE /study-rooms/:id`) from the
> Node backend to direct `supabase.from('StudyRoom')` and
> `supabase.from('StudyRoomMembership')` calls. RLS replaces the
> legacy `studyRooms.service.deleteRoom` ownership check. Socket.IO
> stays in the Node service; the socket handler now reads/writes
> Supabase via the service-role client. Legacy routes/controller/
> service/repo stay on disk behind the `study-rooms` feature flag.

## Design summary

1. **HTTP CRUD via PostgREST** — flat `.from('StudyRoom')` and
   `.from('StudyRoomMembership')` calls.
2. **`getById` nested shape** — the legacy returns
   `{room, members}`. The new path uses PostgREST resource embedding
   or a separate query for members.
3. **RLS** — `StudyRoom` SELECT is open to all authenticated users
   (browsable); INSERT requires `created_by_id = auth.uid()`; UPDATE/
   DELETE require `created_by_id = auth.uid()`. `StudyRoomMembership`
   SELECT is open to all; INSERT requires `user_id = auth.uid()`;
   DELETE allows self or room creator.
4. **Socket layer** — unchanged from the user's perspective. The
   `auth.socket.js` still verifies the legacy JWT. The
   `studyRoom.handler.js` now uses the Supabase service-role client
   to read/write `StudyRoom`, `StudyRoomMembership`, and
   `StudyRoomMessage`. Message inserts happen via
   `supabase.from('StudyRoomMessage').insert(...)`.
5. **No `study-rooms` flag yet** — the existing `featureFlags.js`
   already declares `'study-rooms'`. The facade uses it.

## File-by-file scope

### Created (4)
- `supabase/migrations/0007_study_room_rls.sql` — already covered in 0004 actually; check if anything new is needed
- `frontend/design-system/src/api/studyRooms.api.supabase.js`
- `frontend/design-system/src/api/studyRooms.api.legacy.js`
- `backend/src/lib/studyRoomService.js` — service-role helper used by the socket handler (instead of Prisma)

### Modified (3)
- `frontend/design-system/src/api/studyRooms.api.js` — facade
- `backend/src/sockets/handlers/studyRoom.handler.js` — switch from Prisma to supabaseAdmin
- `frontend/design-system/src/lib/socket.js` — light edit: still uses legacy JWT for the handshake (no change actually)

Wait — the socket layer verification is out of scope. The socket layer stays on legacy JWT. The only change to the backend is the `studyRoom.handler.js` reading from Supabase instead of Prisma. The other files are additive.

### Final scope
### Created (3)
- `frontend/design-system/src/api/studyRooms.api.supabase.js`
- `frontend/design-system/src/api/studyRooms.api.legacy.js`
- `backend/src/lib/studyRoomService.js` — service-role helper for the socket handler

### Modified (2)
- `frontend/design-system/src/api/studyRooms.api.js` — facade
- `backend/src/sockets/handlers/studyRoom.handler.js` — switch from Prisma to supabaseAdmin (additive, since Prisma is still in use elsewhere)

### NOT modified
- `backend/src/sockets/index.js` — unchanged
- `backend/src/sockets/auth.socket.js` — unchanged (still verifies legacy JWT)
- `frontend/design-system/src/hooks/useStudyRoom.js` — untouched
- `frontend/design-system/src/lib/socket.js` — untouched (still uses legacy JWT)
- `backend/src/controllers/studyRooms.controller.js` — unchanged (legacy HTTP route still works)
- All other backend code

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getAll(params)` | array of `StudyRoom` rows | array from `.from('StudyRoom').select('*').eq('is_active', true).order('created_at', {ascending:false})` | ✅ |
| `getById(id)` | `{room, members}` (room merged with members) | `{room, members}` assembled from two queries | ✅ |
| `create(payload)` | `StudyRoom` row | row from `.insert({name, subject_tag, created_by_id: userId}).select().single()` | ✅ |
| `join(id)` | `{success: true, message: 'Joined'}` (envelope with data:null) | `null` (or upsert membership) | ⚠️ (consumer doesn't read) |
| `leave(id)` | same as `join` | `null` from `.delete().eq('room_id', id).eq('user_id', userId)` | ⚠️ |
| `delete(id)` | `{success: true, message: 'Deleted'}` | `null` from `.delete().eq('id', id).eq('created_by_id', userId)` (RLS double-check) | ⚠️ |

The `getById` nested shape matches because we assemble it client-side.

## getById nested shape

```js
async function getById(id) {
  const c = client();
  const roomRes = await c.from('StudyRoom').select('*').eq('id', id).single();
  if (roomRes.error) throw new Error(roomRes.error.message);
  const memberRows = await c.from('StudyRoomMembership')
    .select('*')
    .eq('room_id', id);
  if (memberRes.error) throw new Error(memberRes.error.message);
  return { room: roomRes.data, members: memberRows.data || [] };
}
```

This matches the legacy controller's `get` which does:
```js
const r = await StudyService.getRoom(req.params.id);
const members = await require('../repositories/studyRooms.repository').listMembers(req.params.id);
return res.json(ApiResponse.success(Object.assign({}, r, { members }), 'Room'));
```

The legacy merges members into the room object (using `Object.assign({}, r, {members})`). The new path returns `{room, members}` separately. **This is a shape mismatch.**

Mitigation: the frontend `useStudyRoom.js:25` does `queryClient.setQueryData(['study-room', roomId], payload.room)` — so the `room` field of the new payload is what gets stored. The hook stores the bare room object, not the merged object. ✅ The hook doesn't read the members from the query result; it gets them from the socket's `room_joined` event payload (line 27: `setMembers(payload.members || [])`).

So the frontend actually never consumes the merged shape. **The mismatch is harmless.** The new path can return `{room, members}` or `{...room, members}` — both work. Going with the merged shape `{...room, members}` for absolute parity.

## Socket layer changes

The current `backend/src/sockets/handlers/studyRoom.handler.js` does:
- `prisma.studyRoom.findUnique` (room existence check)
- `prisma.studyRoomMembership.findUnique` (membership check)
- `prisma.studyRoomMembership.findMany` (list members)
- `prisma.studyRoomMessage.findMany` (recent messages)
- `prisma.studyRoomMessage.create` (insert message)

The new path replaces each with a `supabaseAdmin()` call. The service-role client bypasses RLS — appropriate here because the socket handler needs to read on behalf of any user.

A small helper module `backend/src/lib/studyRoomService.js` wraps these calls so the handler stays readable.

## Rollback
```bash
git checkout -- \
  frontend/design-system/src/api/studyRooms.api.js \
  backend/src/sockets/handlers/studyRoom.handler.js
rm -f \
  frontend/design-system/src/api/studyRooms.api.supabase.js \
  frontend/design-system/src/api/studyRooms.api.legacy.js \
  backend/src/lib/studyRoomService.js
```

## Exit criteria
- All 6 verify gates green for study rooms
- Socket.IO study-room flow still works end-to-end (with the new backend handler)
- Zero deletions
- Rollback dry-run passes
