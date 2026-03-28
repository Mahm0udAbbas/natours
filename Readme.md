# Natours

A Node.js and Express-based RESTful API for a tour booking application. This project is built to demonstrate and practice modern backend development using Node.js, Express, and MongoDB. It includes features for managing tours, users, reviews, and user authentication with JWT tokens.

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE=your_database_url
JWT_SECRET=your_secret
```

## Running the App

Development:

```bash
npm run start:dev
```

Production:

```bash
npm run start:prod
```

## Project Structure

```
project-root/
├── controllers/
├── models/
├── routes/
├── utils/
├── public/
├── app.js
├── server.js
└── package.json
```

## License

MIT
