const crypto = require('crypto');
const StudyRepo = require('../repositories/studyRooms.repository');
const InviteRepo = require('../repositories/studyRoomInvites.repository');
const ApiError = require('../utils/ApiError');
const NotifService = require('./notification.service');
const UserRepo = require('../repositories/users.repository');

// 12 chars of base32 (Crockford alphabet, no I/L/O/U) — easy to read aloud,
// URL-safe, ~60 bits of entropy. Plenty for a study-room join link.
function generateCode() {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = crypto.randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function createInvite(userId, roomId, opts = {}) {
  const room = await StudyRepo.findById(roomId);
  if (!room) throw new ApiError('Room not found', 404);
  if (room.created_by_id !== userId) {
    throw new ApiError('Only the room creator can create invites', 403);
  }

  // Retry on the (vanishingly rare) chance of a code collision.
  let invite;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      invite = await InviteRepo.create({
        room_id: roomId,
        code,
        created_by_id: userId,
        expires_at: opts.expires_at ? new Date(opts.expires_at) : null,
        max_uses: opts.max_uses ?? null,
      });
      break;
    } catch (err) {
      if (err?.code === 'P2002' && attempt < 4) continue; // unique violation
      throw err;
    }
  }
  return invite;
}

async function listInvites(userId, roomId) {
  const room = await StudyRepo.findById(roomId);
  if (!room) throw new ApiError('Room not found', 404);
  if (room.created_by_id !== userId) {
    throw new ApiError('Only the room creator can view invites', 403);
  }
  return InviteRepo.listForRoom(roomId);
}

async function revokeInvite(userId, inviteId) {
  const invite = await InviteRepo.findById(inviteId);
  if (!invite) throw new ApiError('Invite not found', 404);
  const room = await StudyRepo.findById(invite.room_id);
  if (!room || room.created_by_id !== userId) {
    throw new ApiError('Forbidden', 403);
  }
  if (invite.revoked_at) return invite;
  return InviteRepo.revoke(inviteId);
}

function isUsable(invite) {
  if (!invite) return false;
  if (invite.revoked_at) return false;
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return false;
  if (invite.max_uses != null && invite.use_count >= invite.max_uses) return false;
  return true;
}

/**
 * Preview an invite. Public — caller does not need to be a member.
 * Returns the room + invite metadata so the frontend can show
 * "You're invited to <Room> in <Subject>".
 */
async function previewInvite(code) {
  const invite = await InviteRepo.findByCode(code);
  if (!invite) throw new ApiError('Invite not found', 404);
  const room = await StudyRepo.findById(invite.room_id);
  if (!room) throw new ApiError('Room no longer exists', 404);
  return {
    invite: {
      code: invite.code,
      expires_at: invite.expires_at,
      max_uses: invite.max_uses,
      use_count: invite.use_count,
      usable: isUsable(invite),
      reason: !isUsable(invite)
        ? invite.revoked_at
          ? 'revoked'
          : invite.expires_at && new Date(invite.expires_at) < new Date()
            ? 'expired'
            : 'exhausted'
        : null,
    },
    room: {
      id: room.id,
      name: room.name,
      subject_tag: room.subject_tag,
    },
  };
}

async function redeemInvite(userId, code) {
  const invite = await InviteRepo.findByCode(code);
  if (!invite) throw new ApiError('Invite not found', 404);
  if (!isUsable(invite)) {
    const reason = invite.revoked_at
      ? 'revoked'
      : invite.expires_at && new Date(invite.expires_at) < new Date()
        ? 'expired'
        : 'exhausted';
    throw new ApiError(`This invite is ${reason}`, 410);
  }

  const room = await StudyRepo.findById(invite.room_id);
  if (!room || !room.is_active) throw new ApiError('Room no longer available', 410);

  // Idempotent: addMember will throw P2002 if the user is already a member.
  // We treat that as a no-op so clicking the same link twice is safe.
  let wasNewMember = true;
  try {
    await StudyRepo.addMember(room.id, userId);
  } catch (err) {
    if (err?.code === 'P2002') {
      wasNewMember = false;
    } else {
      throw err;
    }
  }

  await InviteRepo.incrementUseCount(invite.id);

  // Fire a COLLABORATION notification to the room owner and the invite
  // creator. Only when this redemption was a *new* member — re-redeeming
  // a link for an existing member should be silent.
  if (wasNewMember) {
    let joinerName = 'Someone';
    try {
      const joiner = await UserRepo.findById(userId);
      if (joiner?.full_name) joinerName = joiner.full_name;
    } catch (_) {}

    const title = `${joinerName} joined “${room.name}”`;
    const body = `Your invite was redeemed — ${joinerName} is now in the room.`;

    const recipients = new Set();
    if (room.created_by_id) recipients.add(room.created_by_id);
    if (invite.created_by_id) recipients.add(invite.created_by_id);
    for (const recipientId of recipients) {
      if (recipientId === userId) continue; // don't notify the joiner
      try {
        await NotifService.create(recipientId, 'COLLABORATION', title, body);
      } catch (err) {
        // Notification failures must never block the redemption.
        // eslint-disable-next-line no-console
        console.warn('[redeemInvite] notification failed:', err?.message || err);
      }
    }
  }

  return { room, already_member: !wasNewMember };
}

module.exports = {
  createInvite,
  listInvites,
  revokeInvite,
  previewInvite,
  redeemInvite,
  // exported for tests / future use
  isUsable,
};
