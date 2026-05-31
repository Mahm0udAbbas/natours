# Authentication Guide

This document describes the current authentication and authorization flow implemented in the application as of May 31, 2026.

Main auth files:

- [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)
- [models/userModel.js](/f:/complete-node-bootcamp-master-work-dir/natours/models/userModel.js)
- [routes/usersRoutes.js](/f:/complete-node-bootcamp-master-work-dir/natours/routes/usersRoutes.js)
- [controllers/userController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/userController.js)
- [app.js](/f:/complete-node-bootcamp-master-work-dir/natours/app.js)

## Overview

The app uses JWT-based authentication with password hashing through bcrypt.

High-level flow:

1. A user signs up or logs in.
2. The server creates a JWT containing the user's MongoDB id.
3. The server returns the token in the JSON response and also sets it in an HTTP-only cookie.
4. Protected routes verify the JWT, load the current user, and attach that user to `req.user`.
5. Some routes also apply role-based authorization with `restrictTo`.

## Auth and Account Routes

These routes are mounted under:

```text
/api/v1/users
```

Current auth-related routes:

- `POST /signup`
- `POST /login`
- `POST /forgotPassword`
- `PATCH /resetPassword/:token`
- `PATCH /updatePassword`
- `PATCH /updateMe`
- `DELETE /deleteMe`

Defined in [routes/usersRoutes.js](/f:/complete-node-bootcamp-master-work-dir/natours/routes/usersRoutes.js).

## User Model and Auth Fields

The user schema lives in [models/userModel.js](/f:/complete-node-bootcamp-master-work-dir/natours/models/userModel.js).

Auth-related fields:

- `email`
- `role`
- `password`
- `passwordConfirm`
- `passwordChangedAt`
- `passwordResetToken`
- `passwordResetTokenExpire`
- `active`

Important schema rules:

- `email` must be unique
- `email` is lowercased
- `email` is validated with `validator.isEmail`
- `password` has `select: false`
- `passwordConfirm` must match `password`
- `active` has `select: false`

## Password Hashing

Passwords are hashed in a Mongoose pre-save middleware:

```js
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});
```

What this gives us:

- plain passwords are never stored in the database
- password confirmation is only used for validation
- both signup and password reset reuse the same hashing logic

## Password Change Tracking

The model also updates `passwordChangedAt` whenever an existing user changes their password:

```js
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});
```

This supports invalidating old JWTs after password changes.

## JWT Creation and Delivery

JWT signing is handled by `signToken` in [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js).

```js
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
```

JWT delivery is handled by `createSendToken`:

```js
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookiesOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;
  res.cookie('jwt', token, cookiesOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};
```

Current behavior:

- the token is returned in the JSON response
- the token is also stored in a cookie named `jwt`
- the cookie is `httpOnly`
- the cookie becomes `secure` in production

Important note:

- although the app sets a JWT cookie, the current `protect` middleware only reads the token from the `Authorization` header
- so cookies are being issued, but not yet used for authentication checks

## Signup Flow

Route:

```text
POST /api/v1/users/signup
```

Flow:

1. The client sends `name`, `email`, `password`, and `passwordConfirm`.
2. The controller creates a user with `User.create(...)`.
3. The schema validates the input.
4. The password is hashed in the pre-save middleware.
5. The app creates a JWT.
6. The app returns the JWT and sets the auth cookie.

Current implementation detail:

- `signup` still accepts `role` from `req.body`

That means the code currently allows the client to attempt to set the user's role during signup, which is a security risk and should usually be removed.

## Login Flow

Route:

```text
POST /api/v1/users/login
```

Flow:

1. The client sends `email` and `password`.
2. The controller checks that both fields exist.
3. The app finds the user by email and explicitly includes `password` using `.select('+password')`.
4. The entered password is compared with the stored hash using bcrypt.
5. If valid, the app returns a JWT and sets the auth cookie.

The password comparison helper is:

```js
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};
```

## Protect Middleware

Protected routes use `protect` from [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js).

Current token source:

```http
Authorization: Bearer your-jwt-token
```

Flow inside `protect`:

1. Read `req.headers.authorization`.
2. Check that it starts with `Bearer`.
3. Extract the token.
4. Verify the token using `jwt.verify`.
5. Decode the payload to get the user id.
6. Load the user from the database with `User.findById(decoded.id)`.
7. Reject if the user no longer exists.
8. Reject if the password was changed after the token was issued.
9. Attach the user document to `req.user`.

Protected routes currently include:

- `PATCH /api/v1/users/updatePassword`
- `PATCH /api/v1/users/updateMe`
- `DELETE /api/v1/users/deleteMe`
- `GET /api/v1/tours`
- `DELETE /api/v1/tours/:id`

## Role-Based Authorization

Role checks use `restrictTo(...roles)`.

Current example:

- `DELETE /api/v1/tours/:id` uses:
  - `protect`
  - `restrictTo('admin', 'lead-guide')`

This means:

- the user must be authenticated
- the user role must be either `admin` or `lead-guide`

## Forgot Password Flow

Route:

```text
POST /api/v1/users/forgotPassword
```

Flow:

1. The client sends `email`.
2. The controller checks that the email exists in the request body.
3. The app finds the user by email.
4. The user model generates a random reset token.
5. The plain token is used in the reset URL sent by email.
6. A hashed copy of the token is stored in the database.
7. An expiry time is stored.
8. The user document is saved with `validateBeforeSave: false`.

Reset token generation:

```js
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
```

Why this is good:

- the raw reset token is never stored in the database
- the reset token expires after 10 minutes

## Reset Password Flow

Route:

```text
PATCH /api/v1/users/resetPassword/:token
```

Flow:

1. The client sends the reset token in the URL.
2. The client sends `password` and `passwordConfirm` in the request body.
3. The controller rejects the request if either field is missing.
4. The token from the URL is hashed using `sha256`.
5. The app finds a user whose reset token matches and whose reset token has not expired.
6. The app updates the password fields.
7. The app clears `passwordResetToken` and `passwordResetTokenExpire`.
8. `user.save()` hashes the new password and updates `passwordChangedAt`.
9. The app logs the user in again by issuing a fresh JWT and cookie.

## Update Password Flow

Route:

```text
PATCH /api/v1/users/updatePassword
```

Protection:

- requires `protect`

Flow:

1. The user must already be logged in.
2. The request must include `currentPassword`.
3. The request must include `password` and `passwordConfirm`.
4. The app loads the current user with the password field included.
5. The app checks that `currentPassword` matches the stored password.
6. The app sets the new password values.
7. `user.save()` hashes the password and updates `passwordChangedAt`.
8. The app issues a fresh JWT and cookie.

This is the correct pattern for password updates because it uses `save()` rather than `findByIdAndUpdate()`, so the password middleware still runs.

## UpdateMe Flow

Route:

```text
PATCH /api/v1/users/updateMe
```

Protection:

- requires `protect`

Purpose:

- lets a logged-in user update only profile data

Current behavior:

- rejects requests containing `password` or `passwordConfirm`
- only allows updating `name` and `email`

This is good separation because password changes are forced through the dedicated `updatePassword` route.

## DeleteMe Flow

Route:

```text
DELETE /api/v1/users/deleteMe
```

Protection:

- requires `protect`

Current behavior:

- does not fully delete the user document
- sets `active: false` instead

This is a soft-delete pattern.

The user model also has:










