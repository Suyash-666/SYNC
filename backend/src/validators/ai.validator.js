const { z } = require('zod');

const chatSchema = z.object({ message: z.string().min(1), conversation_id: z.string().uuid().optional() });

const studyPlanSchema = z.object({ subjects: z.array(z.string()).min(1), exam_date: z.string().min(4), hours_per_day: z.number().positive() });

module.exports = { chatSchema, studyPlanSchema };
