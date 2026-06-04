const { z } = require('zod');

const futureDate = z.string().refine((s) => {
  const d = new Date(s);
  return !isNaN(d.getTime()) && d > new Date();
}, { message: 'due_date must be a valid future date' });

const assignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject_id: z.string().uuid().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH']).optional(),
  due_date: futureDate.optional(),
  status: z.enum(['TODO','IN_PROGRESS','REVIEW','SUBMITTED']).optional(),
});

module.exports = { assignmentSchema };
