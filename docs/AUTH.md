# Authentication

This application uses token-based authentication for user accounts.

## Auth Endpoints

Base path:

```text
/api/v1/users
```

Available endpoints:

- `POST /signup`
- `POST /login`
- `POST /forgotPassword`
- `PATCH /resetPassword/:token`
- `PATCH /updatePassword`
- `PATCH /updateMe`
- `DELETE /deleteMe`

## How It Works

### Signup

Create a new account by sending:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "your-password",
  "passwordConfirm": "your-password"
}
```

On success, the API returns an authentication token.

### Login

Log in with:

```json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

On success, the API returns an authentication token.

### Protected Requests

For protected routes, send the token in the `Authorization` header:

```http
Authorization: Bearer your-token
```

## Password Management

### Forgot Password

Use:

```text
POST /api/v1/users/forgotPassword
```

with:

```json
{
  "email": "you@example.com"
}
```

If the email is valid, the app sends password reset instructions.

### Reset Password

Use:

```text
PATCH /api/v1/users/resetPassword/:token
```

with:

```json
{
  "password": "new-password",
  "passwordConfirm": "new-password"
}
```

### Update Password

While logged in, use:

```text
PATCH /api/v1/users/updatePassword
```

with:

```json
{
  "currentPassword": "your-current-password",
  "password": "new-password",
  "passwordConfirm": "new-password"
}
```

## Profile Management

### Update Profile

Use:

```text
PATCH /api/v1/users/updateMe
```

to update allowed profile fields such as:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### Delete Account

Use:

```text
DELETE /api/v1/users/deleteMe
```

to deactivate your account.

## Typical Flow

1. Sign up or log in.
2. Save the returned token.
3. Send the token with protected requests.
4. Use `updatePassword` when changing your password.
5. Use `forgotPassword` and `resetPassword` if you lose access to your account.
