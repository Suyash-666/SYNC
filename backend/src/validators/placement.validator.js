const { z } = require('zod');

const progressSchema = z.object({
  category: z.enum(['DSA','INTERVIEW','APTITUDE','RESUME']),
  topic: z.string().min(1),
  item_name: z.string().min(1),
  status: z.enum(['NOT_STARTED','IN_PROGRESS','COMPLETED']).optional(),
  difficulty: z.enum(['EASY','MEDIUM','HARD']).optional(),
  notes: z.string().optional(),
});

const dsaProblemSchema = z.object({ topic: z.string().min(1), item_name: z.string().min(1), difficulty: z.enum(['EASY','MEDIUM','HARD']) });

module.exports = { progressSchema, dsaProblemSchema };
