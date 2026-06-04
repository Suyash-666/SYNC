const { z } = require('zod');

const profileUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  avatar_url: z.string().url().optional(),
  college: z.string().min(2).optional(),
  degree: z.string().min(2).optional(),
  total_semesters: z.number().int().positive().optional(),
});

module.exports = { profileUpdateSchema };
