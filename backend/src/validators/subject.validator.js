const { z } = require('zod');

const subjectSchema = z.object({
  name: z.string().min(1),
  subject_code: z.string().optional(),
  total_modules: z.number().int().optional(),
});

const moduleSchema = z.object({
  name: z.string().min(1),
  order_index: z.number().int().optional(),
});

module.exports = { subjectSchema, moduleSchema };
