# SYNC API Contract v1.0

Use as the single source of truth when wiring `src/api/` files.

Base URL: `VITE_API_URL/api/v1`
All protected routes require: `Authorization: Bearer <access_token>`

---

## AUTH  `/api/v1/auth`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/signup` | ❌ | `{full_name, email, password, confirm_password}` | `{user, accessToken}` + sets `refreshToken` cookie |
| POST | `/login` | ❌ | `{email, password}` | `{user, accessToken}` + sets cookie |
| POST | `/refresh` | ❌ (cookie) | — | `{accessToken}` + rotates cookie |
| POST | `/logout` | ✅ | — | `{success: true}` + clears cookie |
| POST | `/forgot-password` | ❌ | `{email}` | `{message}` |
| POST | `/reset-password` | ❌ | `{token, new_password}` | `{message}` |
| GET | `/me` | ✅ | — | `{user}` |

**User object shape:**

```json
{
  "id": "cuid",
  "email": "string",
  "full_name": "string",
  "avatar_url": "string | null",
  "role": "STUDENT | MODERATOR | ADMIN",
  "college": "string | null",
  "degree": "string | null",
  "total_semesters": "number | null",
  "is_onboarded": "boolean",
  "is_active": "boolean",
  "created_at": "ISO string"
}
```

---

## USERS  `/api/v1/users`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/profile` | ✅ | — | `{user}` |
| PATCH | `/profile` | ✅ | `{full_name?, college?, degree?, avatar_url?}` | `{user}` |
| DELETE | `/account` | ✅ | — | `{message}` |
| POST | `/onboarding` | ✅ | see below | `{user, semester}` |

**Onboarding body:**

```json
{
  "degree": "string",
  "college": "string",
  "total_semesters": 8,
  "current_semester": 4,
  "semester_start_date": "2024-01-15",
  "semester_end_date": "2024-05-31",
  "goals": ["Improve Attendance", "Track Assignments"],
  "study_habits": {
    "hours_per_day": 4,
    "challenge": "Procrastination",
    "preferred_time": "Evening"
  },
  "interests": ["DSA", "Web Dev", "AI/ML"]
}
```

**Attendance summary:**
| GET | `/attendance/summary` | ✅ | — | `[{subject_id, subject_name, total, present, absent, percentage}]` |

---

## SEMESTERS  `/api/v1/semesters`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | — | `[semester]` |
| POST | `/` | ✅ | `{semester_number, academic_year, start_date?, end_date?}` | `{semester}` |
| GET | `/:id` | ✅ | — | `{semester, subjects[]}` |
| PATCH | `/:id` | ✅ | partial semester fields | `{semester}` |
| DELETE | `/:id` | ✅ | — | `{message}` |
| PATCH | `/:id/set-current` | ✅ | — | `{semester}` |

**Semester object:**
```json
{
  "id": "cuid",
  "user_id": "cuid",
  "semester_number": 4,
  "academic_year": "2024-25",
  "start_date": "ISO string | null",
  "end_date": "ISO string | null",
  "is_current": true
}
```

---

## SUBJECTS  `/api/v1`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/semesters/:semId/subjects` | ✅ | — | `[subject]` |
| POST | `/semesters/:semId/subjects` | ✅ | `{name, subject_code, total_modules, internal_max_marks}` | `{subject}` |
| GET | `/subjects/:id` | ✅ | — | `{subject, modules[], attendance_stats}` |
| PATCH | `/subjects/:id` | ✅ | partial subject fields | `{subject}` |
| DELETE | `/subjects/:id` | ✅ | — | `{message}` |
| POST | `/subjects/:id/modules` | ✅ | `{name, order_index}` | `{module}` |
| PATCH | `/subjects/:id/modules/:moduleId` | ✅ | `{name?}` | `{module}` |
| DELETE | `/subjects/:id/modules/:moduleId` | ✅ | — | `{message}` |
| PATCH | `/subjects/:subjectId/topics/:topicId/toggle` | ✅ | — | `{topic}` |

---

## ATTENDANCE  `/api/v1/subjects/:subjectId/attendance`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | `?month=1&year=2024` | `[{date, status}]` |
| POST | `/` | ✅ | `{date, status}` — status: `PRESENT\\|ABSENT\\|CANCELLED` | `{record}` |
| PUT | `/:date` | ✅ | `{status}` | `{record}` |

---

## ASSIGNMENTS  `/api/v1/assignments`

| Method | Endpoint | Auth | Query/Body | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | `?status=&priority=&subject_id=&page=1&limit=20` | `{data[], pagination}` |
| POST | `/` | ✅ | `{title, description?, subject_id?, priority, due_date}` | `{assignment}` |
| GET | `/:id` | ✅ | — | `{assignment}` |
| PATCH | `/:id` | ✅ | partial assignment fields | `{assignment}` |
| DELETE | `/:id` | ✅ | — | `{message}` |
| PATCH | `/:id/status` | ✅ | `{status}` — `TODO\\|IN_PROGRESS\\|REVIEW\\|SUBMITTED` | `{assignment}` |

**Assignment object:**
```json
{
  "id": "cuid",
  "title": "string",
  "description": "string | null",
  "subject_id": "cuid | null",
  "subject": {"id":"cuid","name":"string","subject_code":"string"},
  "priority": "LOW | MEDIUM | HIGH",
  "status": "TODO | IN_PROGRESS | REVIEW | SUBMITTED",
  "due_date": "ISO string",
  "submitted_at": "ISO string | null",
  "created_at": "ISO string"
}
```

**Pagination shape (all paginated endpoints):**
```json
{
  "data": [],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## NOTES  `/api/v1/notes`

| Method | Endpoint | Auth | Query/Body | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | `?folder=&tags[]=&search=&page=1&limit=20` | `{data[], pagination}` |
| POST | `/` | ✅ | `{title, content?, folder?, tags?[]}` | `{note}` |
| GET | `/:id` | ✅ | — | `{note}` |
| PATCH | `/:id` | ✅ | partial note fields | `{note}` |
| DELETE | `/:id` | ✅ | — | soft delete → `{message}` |
| GET | `/folders` | ✅ | — | `["Semester 4", "Personal", "Placement Prep"]` |

---

## RESOURCES  `/api/v1/resources`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | `?subject_id=&file_type=&page=1&limit=20` | `{data[], pagination}` |
| POST | `/upload` | ✅ | `multipart/form-data: {file, subject_id?, title}` | `{resource}` |
| POST | `/link` | ✅ | `{title, url, subject_id?}` | `{resource}` |
| DELETE | `/:id` | ✅ | — | `{message}` |

---

## ANALYTICS  `/api/v1/analytics`

| Method | Endpoint | Auth | Query | Returns |
|---|---|---|---|---|
| GET | `/overview` | ✅ | — | `{productivity_score, study_hours_month, assignment_completion_rate, attendance_pct, streak_days, pending_assignments}` |
| GET | `/attendance` | ✅ | `?period=7d\\|30d\\|semester` | `[{date, present, absent, total}]` |
| GET | `/assignments` | ✅ | `?period=7d\\|30d\\|semester` | `[{week, assigned, submitted, overdue}]` |
| GET | `/productivity` | ✅ | — | `{total, breakdown: {attendance, assignments, streak, notes_activity}}` |
| GET | `/subjects` | ✅ | — | `[{subject_id, name, syllabus_pct, attendance_pct, internal_avg}]` |

---

## AI  `/api/v1/ai`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/chat` | ✅ | `{message, conversation_id?}` | `{response, conversation_id}` |
| POST | `/study-plan` | ✅ | `{subjects[], exam_date, hours_per_day}` | `{plan}` |
| GET | `/history` | ✅ | — | `[{conversation_id, preview, created_at}]` |
| GET | `/history/:conversationId` | ✅ | — | `[{role, content, created_at}]` |
| DELETE | `/history/:conversationId` | ✅ | — | `{message}` |

**Rate limit:** 20 requests/hour per user on all AI endpoints.

---

## STUDY ROOMS  `/api/v1/study-rooms`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | `?active=true` | `[room]` |
| POST | `/` | ✅ | `{name, subject_tag?}` | `{room}` |
| GET | `/:id` | ✅ | — | `{room, members[], recent_messages[]}` |
| POST | `/:id/join` | ✅ | — | `{membership}` |
| POST | `/:id/leave` | ✅ | — | `{message}` |
| DELETE | `/:id` | ✅ | — | `{message}` (creator/moderator only) |

---

## NOTIFICATIONS  `/api/v1/notifications`

| Method | Endpoint | Auth | Query | Returns |
|---|---|---|---|---|
| GET | `/` | ✅ | `?type=&is_read=&page=1&limit=20` | `{data[], pagination, unread_count}` |
| PATCH | `/:id/read` | ✅ | — | `{notification}` |
| PATCH | `/read-all` | ✅ | — | `{message}` |
| DELETE | `/:id` | ✅ | — | `{message}` |

---

## PLACEMENT  `/api/v1/placement`

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/progress` | ✅ | `?category=DSA\\|INTERVIEW\\|APTITUDE\\|RESUME&status=` | `{data[], pagination}` |
| POST | `/progress` | ✅ | `{category, topic, item_name, status, difficulty?, notes?}` | `{item}` |
| PATCH | `/progress/:id` | ✅ | `{status?, notes?}` | `{item}` |
| DELETE | `/progress/:id` | ✅ | — | `{message}` |
| GET | `/stats` | ✅ | — | `{DSA:{total,completed,easy,medium,hard}, INTERVIEW:{...}, APTITUDE:{...}, RESUME:{...}}` |
| POST | `/dsa/problems` | ✅ | `{item_name, topic, difficulty, status, notes?}` | `{item}` |
| GET | `/dsa/problems` | ✅ | `?difficulty=&status=&topic=` | `{data[], pagination}` |

---

## STANDARD RESPONSE FORMAT

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descriptive error message",
  "statusCode": 400,
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## SOCKET.IO EVENTS

### Namespace: `/study-rooms`

**Handshake:** `{ auth: { token: "<access_token>" } }`

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `join_room` | `{room_id}` |
| Client → Server | `leave_room` | `{room_id}` |
| Client → Server | `send_message` | `{room_id, content}` |
| Client → Server | `typing_start` | `{room_id}` |
| Client → Server | `typing_stop` | `{room_id}` |
| Server → Client | `room_joined` | `{room, members[], recent_messages[]}` |
| Server → Client | `new_message` | `{id, content, user:{id,full_name,avatar_url}, created_at}` |
| Server → Client | `user_joined` | `{user:{id,full_name,avatar_url}}` |
| Server → Client | `user_left` | `{user_id}` |
| Server → Client | `typing_start` | `{user:{id,full_name}}` |
| Server → Client | `typing_stop` | `{user_id}` |
| Server → Client | `error` | `{message}` |

### Namespace: `/notifications`

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `mark_read` | `{notification_id}` |
| Server → Client | `new_notification` | `{id, type, title, body, created_at}` |
| Server → Client | `notification_read` | `{notification_id}` |

---

## ENV VARIABLES REFERENCE

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=SYNC
```

### Backend (`.env`)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
ALLOWED_ORIGINS=http://localhost:5173
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=<service role key>
SUPABASE_STORAGE_BUCKET=resources
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...  (optional)
REDIS_URL=redis://...   (optional)
```

---

*SYNC API Contract v1.0 — Use during Stage I-1 (Gemini 2.5 Pro — Integration)*
