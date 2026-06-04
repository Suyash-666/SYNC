const { z } = require('zod');

const attendanceSchema = z.object({
  date: z.string(),
  status: z.enum(['PRESENT','ABSENT','CANCELLED']),
});

module.exports = { attendanceSchema };
