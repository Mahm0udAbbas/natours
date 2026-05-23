# Natours API

Natours is a Node.js, Express, and MongoDB backend for a tour booking-style application. At this stage, the project already includes:

- Tour CRUD endpoints
- Advanced tour querying with filtering, sorting, field limiting, and pagination
- Tour analytics endpoints using MongoDB aggregation
- User signup and login with JWT authentication
- Route protection middleware for private API access
- Centralized error handling for application, MongoDB, and JWT errors

This documentation reflects the application as it exists right now, including unfinished areas.

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- Password hashing with `bcrypt`
- Request logging with `morgan`

## Project Structure

```text
natours/
|-- controllers/
|   |-- authController.js
|   |-- errorController.js
|   |-- tourController.js
|   `-- userController.js
|-- models/
|   |-- tourModel.js
|   `-- userModel.js
|-- routes/
|   |-- toursRoutes.js
|   `-- usersRoutes.js
|-- utils/
|   |-- apiFeatures.js
|   |-- appError.js
|   `-- catchAsync.js
|-- dev-data/
|   |-- data/
|   `-- import-dev-data.js
|-- public/
|-- app.js
|-- server.js
`-- package.json
```

## Current Features

### Tours

- Create, read, update, and delete tours
- Hide `secretTour` documents from normal queries and aggregations
- Auto-generate a slug from the tour name before save
- Compute virtual field `durationWeeks`
- Get top 5 cheap tours through an alias route
- Get aggregated tour statistics
- Get a monthly plan by year

### Authentication

- Sign up with name, email, password, and password confirmation
- Log in with email and password
- Issue JWT tokens
- Protect private routes with `Authorization: Bearer <token>`
- Reject tokens for deleted users
- Reject tokens issued before a password change

### Users

- Fetch all users
- User single-resource CRUD handlers are still placeholders and currently return a `500` response with a "not defined yet" message

## Environment Variables

Create a `.env` file in the project root.

Required values used by the current code:

```env
NODE_ENV=development
PORT=3000
DATABASE_LOCAL=mongodb://127.0.0.1:27017/natours
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=90d
```

Optional values present in the project for future or alternate setups:

```env
DATABASE=
DATABASE_PASSWORD=
```

Notes:

- `server.js` currently connects using `DATABASE_LOCAL`
- `app.js` enables request logging only when `NODE_ENV=development`
- The repository includes an `.env.example`, but the runtime code expects `PORT` in uppercase

## Installation

```bash
npm install
```

## Running the App

Development:

```bash
npm start
```

Production-like mode:

```bash
npm run start:prod
```

Debug with Chrome DevTools:

```bash
npm run debug
```

The server starts from [server.js](/f:/complete-node-bootcamp-master-work-dir/natours/server.js) and mounts the Express app from [app.js](/f:/complete-node-bootcamp-master-work-dir/natours/app.js).

## Database Seeding

The project includes a seed utility for tour data in [dev-data/import-dev-data.js](/f:/complete-node-bootcamp-master-work-dir/natours/dev-data/import-dev-data.js).

Import sample tours:

```bash
node dev-data/import-dev-data.js --import
```

Delete all tours:

```bash
node dev-data/import-dev-data.js --delete
```

## API Base URL

Local base URL:

```text
http://localhost:3000/api/v1
```

## Authentication Flow

### Signup

`POST /api/v1/users/signup`

Request body:

```json
{
  "name": "Mahmoud Abbas",
  "email": "mahmoud@example.com",
  "password": "test1234",
  "passwordConfirm": "test1234"
}
```

Success response:

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

### Login

`POST /api/v1/users/login`

Request body:

```json
{
  "email": "mahmoud@example.com",
  "password": "test1234"
}
```

Success response:

```json
{
  "status": "success",
  "token": "jwt-token"
}
```

### Using Protected Routes

Add the token in the `Authorization` header:

```http
Authorization: Bearer your-jwt-token
```

At the moment, `GET /api/v1/tours` is protected by `protect`.

## Tours API

### Get all tours

`GET /api/v1/tours`

Requires JWT authentication.

Supported query features:

- Filtering: `?difficulty=easy&price[lte]=500`
- Sorting: `?sort=price,-ratingsAverage`
- Field limiting: `?fields=name,price,ratingsAverage`
- Pagination: `?page=2&limit=10`

Example:

```http
GET /api/v1/tours?difficulty=easy&price[lte]=1500&sort=price&fields=name,price&page=1&limit=5
```

### Get a single tour

`GET /api/v1/tours/:id`

### Create a tour

`POST /api/v1/tours`

Current implementation does not require authentication.

Example body:

```json
{
  "name": "The Forest Hiker Plus",
  "duration": 7,
  "maxGroupSize": 15,
  "difficulty": "easy",
  "price": 497,
  "summary": "A hiking tour through the forest.",
  "description": "A longer test description for the tour.",
  "imageCover": "tour-1-cover.jpg",
  "startDates": ["2026-06-01", "2026-07-15"]
}
```

### Update a tour

`PATCH /api/v1/tours/:id`

### Delete a tour

`DELETE /api/v1/tours/:id`

### Top 5 cheap tours

`GET /api/v1/tours/top-5-cheap`

This route injects:

- `limit=5`
- `sort=-ratingsAverage,price`
- `fields=name,price,ratingsAverage,difficulty,summary`

### Tour statistics

`GET /api/v1/tours/tour-stats`

Returns grouped stats for tours with `ratingsAverage >= 4.5`, grouped by difficulty.

### Monthly plan

`GET /api/v1/tours/monthly-plan/:year`

Example:

```http
GET /api/v1/tours/monthly-plan/2026
```

## Users API

### Get all users

`GET /api/v1/users`

### Placeholder routes

The following handlers exist but are not implemented yet:

- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

## Error Handling

The app uses a centralized error flow based on:

- [utils/appError.js](/f:/complete-node-bootcamp-master-work-dir/natours/utils/appError.js) for operational errors
- [utils/catchAsync.js](/f:/complete-node-bootcamp-master-work-dir/natours/utils/catchAsync.js) for async controller wrapping
- [controllers/errorController.js](/f:/complete-node-bootcamp-master-work-dir/natours/controllers/errorController.js) for final error responses

In development mode, errors include stack traces.

In production mode, the app formats:

- Mongoose cast errors
- Mongoose validation errors
- MongoDB duplicate key errors
- Invalid JWT errors
- Expired JWT errors

## Important Implementation Notes

- Tour queries automatically exclude `secretTour: true`
- Aggregation pipelines also exclude secret tours
- Passwords are hashed before saving users
- User passwords are excluded from query results by default
- `passwordConfirm` validation works on create/save, not on update queries
- The codebase currently logs every request header in `app.js`

## Current Limitations

- There is no role-based authorization yet
- Most user CRUD operations are not implemented
- Tour create, update, and delete routes are not protected yet
- No review or booking resources are wired into the API yet
- No automated test suite is set up yet
- Some repository files and placeholders suggest future features that are not active yet

## Suggested Next Documentation Updates

As the app grows, the next useful additions would be:

- Role and permission matrix
- Postman collection or OpenAPI spec
- Deployment instructions
- Testing instructions
- Review, booking, and payment flow docs
