export const lower = (value) => String(value || '').toLowerCase();

export const mapAssignment = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description || '',
  subject: item.subject?.name || item.subject_name || item.subject_id || 'General',
  priority: item.priority ? item.priority[0] + item.priority.slice(1).toLowerCase() : 'Medium',
  dueDate: item.due_date || item.dueDate,
  progress: item.status === 'SUBMITTED' ? 100 : item.status === 'REVIEW' ? 80 : item.status === 'IN_PROGRESS' ? 45 : 0,
  status: lower(item.status || 'TODO'),
  submittedAt: item.submitted_at,
});

export const mapNote = (item) => ({
  id: item.id,
  folder: item.folder || 'Unsorted',
  title: item.title,
  content: item.content || '',
  tags: item.tags || [],
  createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : Date.now(),
});

export const mapNotification = (item) => ({
  id: item.id,
  type: item.type,
  title: item.title,
  body: item.body,
  ts: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  unread: !item.is_read,
  is_read: item.is_read,
});

export const mapResource = (item) => ({
  id: item.id,
  type: item.file_type,
  name: item.title,
  subject: item.subject?.name || item.subject_id || 'General',
  size: item.file_size ? `${Math.round(item.file_size / 1024)} KB` : '-',
  date: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  url: item.file_url,
});

export const mapStudyRoom = (room) => ({
  id: room.id,
  name: room.name,
  subject: room.subject_tag || 'General',
  members: room.members?.length || room.members_count || 0,
  active: room.is_active,
});

export const mapStudyMessage = (message) => ({
  id: message.id,
  sender: message.user?.name || message.user?.full_name || 'You',
  user_id: message.user_id,
  text: message.content,
  ts: message.created_at ? new Date(message.created_at).getTime() : Date.now(),
  avatar: message.user?.avatar || message.user?.avatar_url || '',
});

export const mapPlacementItem = (item) => ({
  id: item.id,
  category: item.category,
  topic: item.topic,
  item_name: item.item_name,
  status: lower(item.status || 'NOT_STARTED'),
  difficulty: item.difficulty || null,
  notes: item.notes || '',
});

export const mapSemester = (semester) => ({
  id: semester.id,
  semesterNumber: semester.semester_number,
  academicYear: semester.academic_year,
  startDate: semester.start_date,
  endDate: semester.end_date,
  isCurrent: semester.is_current,
});
