# Authentication Guide

This document explains the authentication and authorization flow currently implemented in this project.

The auth system is centered around:

- [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)
- [models/userModel.js](/f:/complete-node-bootcamp-master-work-dir/natours/models/userModel.js)
- [routes/usersRoutes.js](/f:/complete-node-bootcamp-master-work-dir/natours/routes/usersRoutes.js)

## Overview

The application uses JSON Web Tokens (JWT) for authentication.

High-level flow:

1. A user signs up or logs in.
2. The server creates a JWT that contains the user's MongoDB id.
3. The client sends that token in the `Authorization` header.
4. Protected routes verify the token and load the current user.
5. Some routes also apply role-based authorization.

## Auth Routes

These routes are mounted under:

```text
/api/v1/users
```

Current auth endpoints:

- `POST /signup`
- `POST /login`
- `POST /forgotPassword`
- `PATCH /resetPassword/:token`

Defined in [routes/usersRoutes.js](/f:/complete-node-bootcamp-master-work-dir/natours/routes/usersRoutes.js).

## User Model and Password Security

The user schema lives in [models/userModel.js](/f:/complete-node-bootcamp-master-work-dir/natours/models/userModel.js).

Relevant fields:

- `name`
- `email`
- `role`
- `password`
- `passwordConfirm`
- `passwordChangedAt`
- `passwordResetToken`
- `passwordResetTokenExpire`

Important auth-related rules:

- `email` must be unique
- `email` is validated with `validator.isEmail`
- `password` has `select: false`, so it is hidden from normal queries
- `passwordConfirm` must match `password` during document validation

### Password Hashing

Before a user is saved, the model hashes the password with bcrypt:

```js
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});
```

What this means:

- plain passwords are never stored directly
- `passwordConfirm` is only used for validation and then removed
- password hashing happens automatically during `save()` and `create()`

### Password Change Tracking

The model also updates `passwordChangedAt` when a password is changed on an existing user:

```js
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});
```

This is used later to invalidate old JWTs after a password reset or password change.

## Token Creation

JWT creation is handled by `signToken` in [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js).

```js
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
```

The token contains:

- the user id
- a signature created with `JWT_SECRET`
- an expiration based on `JWT_EXPIRES_IN`

## Signup Flow

Route:

```text
POST /api/v1/users/signup
```

Controller:

- `signup` in [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)

Flow:

1. The client sends `name`, `email`, `password`, and `passwordConfirm`.
2. The controller creates a new `User`.
3. Mongoose validates the schema fields.
4. The password is hashed by the pre-save middleware.
5. The controller generates a JWT using the new user's id.
6. The response returns the token and the created user.

Example request:

```json
{
  "name": "Mahmoud Abbas",
  "email": "mahmoud@example.com",
  "password": "test1234",
  "passwordConfirm": "test1234"
}
```

Example response:

```json
{
  "status": "success",
  "message": "user created successfully",
  "token": "jwt-token",
  "data": {
    "user": {
      "_id": "...",
      "name": "Mahmoud Abbas",
      "email": "mahmoud@example.com",
      "role": "user"
    }
  }
}
```

## Login Flow

Route:

```text
POST /api/v1/users/login
```

Controller:

- `login` in [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)

Flow:

1. The client sends `email` and `password`.
2. The controller checks that both values exist.
3. The app finds the user by email and explicitly includes the password using `.select('+password')`.
4. The submitted password is compared with the hashed password using bcrypt.
5. If the credentials are valid, a JWT is returned.

Example request:

```json
{
  "email": "mahmoud@example.com",
  "password": "test1234"
}
```

Example response:

```json
{
  "status": "success",
  "token": "jwt-token"
}
```

## Protected Route Flow

The `protect` middleware is used to guard routes that require authentication.

Defined in:

- [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)

Current example:

- `GET /api/v1/tours` in [routes/toursRoutes.js](/f:/complete-node-bootcamp-master-work-dir/natours/routes/toursRoutes.js)

Expected request header:

```http
Authorization: Bearer your-jwt-token
```

Flow inside `protect`:

1. Read the `Authorization` header.
2. Check that it starts with `Bearer`.
3. Extract the token from the header.
4. Verify the token using `jwt.verify`.
5. Decode the token to get the user id.
6. Query the database to make sure the user still exists.
7. Check whether the user changed their password after the token was issued.
8. Attach the fresh user document to `req.user`.
9. Continue to the next middleware or route handler.

Possible failures:

- missing token
- invalid token
- expired token
- user deleted after token creation
- password changed after token creation

## Role-Based Authorization

The app also supports authorization by role using `restrictTo(...roles)`.

Defined in:

- [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)

Typical usage pattern:

```js
protect, restrictTo('admin')
```

Current example in the codebase:

- `DELETE /api/v1/tours/:id` requires:
  - `protect`
  - `restrictTo('admin', 'lead-guide')`

That route is defined in [routes/toursRoutes.js](/f:/complete-node-bootcamp-master-work-dir/natours/routes/toursRoutes.js).

This means:

- the user must be logged in
- the user role must be either `admin` or `lead-guide`

## Forgot Password Flow

Route:

```text
POST /api/v1/users/forgotPassword
```

Controller:

- `forgotPassword` in [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)

Flow:

1. The client sends an email address in the request body.
2. The controller checks that `req.body.email` exists.
3. The app finds the user by email.
4. The user document generates a reset token through `createPasswordResetToken()`.
5. The plain reset token is returned from the model method.
6. The hashed reset token and expiry time are stored in MongoDB.
7. The user is saved with `validateBeforeSave: false`.
8. A reset URL is built and sent to the user's email.

Example request:

```json
{
  "email": "mahmoud@example.com"
}
```

Reset URL format:

```text
PATCH /api/v1/users/resetPassword/:token
```

### Why the Reset Token Is Hashed

The model stores a hashed version of the reset token:

```js
this.passwordResetToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');
```

This is safer because:

- the raw token is only sent to the user
- the database stores only the hashed token
- if the database is leaked, the raw reset token is not directly exposed

### Expiry Time

The reset token currently expires after 10 minutes:

```js
this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;
```

## Reset Password Flow

Route:

```text
PATCH /api/v1/users/resetPassword/:token
```

Controller:

- `resetPassword` in [controllers/authController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/authController.js)

Flow:

1. The client sends the reset token in the URL.
2. The client sends `password` and `passwordConfirm` in the request body.
3. The controller checks that both fields are present.
4. The token from the URL is hashed using `sha256`.
5. The app searches for a user whose stored reset token matches and whose reset token has not expired.
6. If no matching user exists, the token is rejected.
7. If the token is valid, the controller sets the new password and password confirmation on the user document.
8. The reset token fields are cleared.
9. `user.save()` triggers password hashing middleware.
10. A fresh JWT is created and returned to the user.

Example request body:

```json
{
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}
```

If `password` or `passwordConfirm` is missing, the controller returns a `400` error.

## Password Comparison

The user model provides `correctPassword`:

```js
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};
```

This is used during login to compare:

- the plain password from the request
- the hashed password stored in the database

## Token Invalidation After Password Change

The user model provides `changedPasswordAfter`:

```js
userSchema.methods.changedPasswordAfter = async function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};
```

This is used in the `protect` middleware.

Meaning:

- if a token was issued before the password was changed, that token becomes invalid
- the user must log in again

## Error Handling in Auth

All async auth controllers are wrapped with [utils/catchAsync.js](/f:/complete-node-bootcamp-master-work-dir/natours/utils/catchAsync.js).

This means:

- thrown async errors are forwarded to the global error handler
- the auth controllers stay cleaner
- operational auth errors are returned consistently through `AppError`

Related files:

- [utils/catchAsync.js](/f:/complete-node-bootcamp-master-work-dir/natours/utils/catchAsync.js)
- [utils/appError.js](/f:/complete-node-bootcamp-master-work-dir/natours/utils/appError.js)
- [controllers/errorController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/errorController.js)

## Current Auth-Related Notes

The current implementation is solid for learning and local development, and it already includes:

- password hashing
- JWT-based login
- protected routes
- role-based authorization middleware
- forgot-password flow
- reset-password flow
- token invalidation after password changes

Current implementation notes:

- `signup` currently accepts `role` from `req.body`
- auth currently uses bearer tokens in headers, not cookies

## Recommended Request Sequence

Typical client flow:

1. `POST /api/v1/users/signup` or `POST /api/v1/users/login`
2. store the returned JWT
3. send `Authorization: Bearer <token>` for protected requests
4. if the token becomes invalid, log in again
5. if the user forgets the password:
   send `POST /api/v1/users/forgotPassword`
6. receive the reset token by email
7. send `PATCH /api/v1/users/resetPassword/:token` with a new password
8. receive a fresh JWT after reset
