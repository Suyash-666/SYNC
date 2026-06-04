const { z } = require('zod');

const semesterSchema = z.object({
  semester_number: z.number().int().positive(),
  academic_year: z.string().min(4),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
});

module.exports = { semesterSchema };
