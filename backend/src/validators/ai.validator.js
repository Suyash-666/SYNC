const { z } = require('zod');

// `conversation_id` is optional and nullable so that the first message of a
// new chat (no id yet) is accepted. The controller falls back to a fresh
// UUID when this field is missing or null.
const chatSchema = z.object({
  message: z.string().min(1),
  conversation_id: z.string().uuid().nullish(),
});

const studyPlanSchema = z.object({
  subjects: z.array(z.string()).min(1),
  exam_date: z.string().min(4),
  hours_per_day: z.number().positive(),
});

module.exports = { chatSchema, studyPlanSchema };
