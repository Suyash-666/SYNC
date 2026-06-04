const { z } = require('zod');

const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

module.exports = { noteSchema };
