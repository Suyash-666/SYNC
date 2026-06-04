const { z } = require('zod');

const passwordRule = z.string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), { message: 'Must contain an uppercase letter' })
  .refine((val) => /[0-9]/.test(val), { message: 'Must contain a number' })
  .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Must contain a special character' });

const signupSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: passwordRule,
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, { message: 'Passwords must match', path: ['confirm_password'] });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({ token: z.string().min(1), new_password: passwordRule });

module.exports = { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
