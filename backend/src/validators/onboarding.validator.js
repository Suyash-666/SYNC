const { z } = require('zod');

const onboardingSchema = z.object({
  degree: z.string().min(1),
  college: z.string().min(1),
  total_semesters: z.number().int().positive(),
  current_semester: z.number().int().positive(),
  semester_start_date: z.string().optional(),
  semester_end_date: z.string().optional(),
  goals: z.array(z.string()).optional(),
  study_habits: z.record(z.any()).optional(),
  interests: z.array(z.string()).optional(),
});

module.exports = { onboardingSchema };
