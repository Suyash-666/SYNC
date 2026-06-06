const { z } = require('zod');

// POST /study-rooms/:roomId/invites
// All fields optional. expires_at accepts ISO-8601; max_uses is a positive int.
const createInviteSchema = z.object({
  expires_at: z.string().datetime().optional().nullable(),
  max_uses: z.number().int().positive().optional().nullable(),
});

module.exports = { createInviteSchema };
