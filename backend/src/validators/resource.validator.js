const { z } = require('zod');

const linkResourceSchema = z.object({
  title: z.string().min(1),
  subject_id: z.string().uuid().optional(),
  file_type: z.enum(['PDF','IMAGE','LINK','VIDEO']).optional(),
  file_url: z.string().url().optional(),
});

module.exports = { linkResourceSchema };
