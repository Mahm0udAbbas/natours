const { validate, z } = require('../middleware/validateRequest');
const { toPlainText } = require('../utils/sanitizeText');

const plainText = z.preprocess(
  toPlainText,
  z.string().min(1, 'This field cannot be empty'),
);

const email = z
  .string()
  .trim()
  .email('Please provide a valid email')
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, 'Password must contain at least 8 characters');

const passwordPair = {
  password,
  passwordConfirm: z.string(),
};

const confirmPassword = (schema) =>
  schema.refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords are not the same',
  });

const signupSchema = confirmPassword(
  z
    .object({
      name: plainText,
      email,
      ...passwordPair,
    })
    .strict(),
);

const loginSchema = z
  .object({
    email,
    password: z.string().min(1, 'Please enter your password'),
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email,
  })
  .strict();

const resetPasswordParamsSchema = z
  .object({
    token: z
      .string()
      .regex(/^[a-fA-F0-9]{64}$/, 'Password reset token is invalid'),
  })
  .strict();

const resetPasswordSchema = confirmPassword(z.object(passwordPair).strict());

const updatePasswordSchema = confirmPassword(
  z
    .object({
      currentPassword: z.string().min(1, 'Please enter your current password'),
      ...passwordPair,
    })
    .strict(),
);

const updateMeSchema = z
  .object({
    name: plainText.optional(),
    email: email.optional(),
  })
  .strict()
  .refine((data) => data.name || data.email, {
    message: 'Please provide a name or email to update',
  });

exports.validateSignup = validate({ body: signupSchema });
exports.validateLogin = validate({ body: loginSchema });
exports.validateForgotPassword = validate({ body: forgotPasswordSchema });
exports.validateResetPassword = validate({
  params: resetPasswordParamsSchema,
  body: resetPasswordSchema,
});
exports.validateUpdatePassword = validate({ body: updatePasswordSchema });
exports.validateUpdateMe = validate({ body: updateMeSchema });
