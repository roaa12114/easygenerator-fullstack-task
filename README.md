# Easygenerator Full Stack Assessment — Sign Up / Sign In Module

A production-ready authentication module built with React + TypeScript on the frontend and NestJS + MongoDB on the backend.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** NestJS, TypeScript
- **Database:** MongoDB (Atlas), Mongoose
- **Auth:** JWT delivered via httpOnly cookies
- **Validation:** class-validator
- **Password hashing:** bcrypt

## Prerequisites

- Node.js (v18+ recommended)
- npm
- A MongoDB Atlas cluster (or local MongoDB instance)

## Setup

### 1. Clone the repository

```
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Backend setup

```
cd backend
npm install
```

Create a `.env` file in `/backend` based on `.env.example`:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret-string
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Run the backend:

```
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### 3. Frontend setup

```
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

- Sign up, sign in, and sign out flows, backed by a persistent session (survives page refresh)
- Protected route: the welcome page is only reachable while authenticated, with an automatic redirect to sign-in otherwise
- Client-side validation mirrors backend rules for immediate feedback, with server-side validation as the real enforcement layer
- Clear error messages surfaced from the backend (e.g. duplicate email, invalid credentials)

## Frontend Structure

```
frontend/src
  api/auth.ts            API calls (signup, signin, logout, getMe)
  context/useAuth.tsx    Auth context + hook — tracks logged-in state app-wide
  components/
    protectedRoute.tsx   Redirects to sign-in if not authenticated
  pages/
    signIn.tsx
    signUp.tsx
    welcome.tsx
  App.tsx                Route definitions
```

## API Endpoints

| Method | Endpoint         | Auth required | Description                          |
|--------|------------------|----------------|---------------------------------------|
| POST   | /auth/sign-up    | No             | Register a new user                   |
| POST   | /auth/sign-in    | No             | Log in and receive an auth cookie     |
| POST   | /auth/logout     | No             | Clear the auth cookie                 |
| GET    | /auth/me         | Yes            | Returns the welcome message + user    |

### Field requirements

**Sign up**
- `email` — must be a valid email format, must be unique
- `name` — minimum 3 characters
- `password` — minimum 8 characters, at least one letter, one number, and one special character

**Sign in**
- `email`, `password` — checked against stored credentials

## Testing the API with curl

These examples assume the backend is running on `http://localhost:3000`. Run them from a Bash-compatible shell (Git Bash, WSL, macOS/Linux Terminal).

**Sign up**
```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Passw0rd!"}' \
  -c cookies.txt -v
```

**Sign in**
```bash
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Passw0rd!"}' \
  -c cookies.txt -v
```

**Access the protected route** (using the cookie saved from sign-up/sign-in above)
```bash
curl http://localhost:3000/auth/me -b cookies.txt -v
```

**Confirm the route is actually protected** (no cookie — should return 401)
```bash
curl http://localhost:3000/auth/me -v
```

**Log out**
```bash
curl -X POST http://localhost:3000/auth/logout -b cookies.txt -c cookies.txt -v
```

## Security Notes

- Passwords are hashed with bcrypt before storage — never stored or logged in plain text.
- Authentication uses an httpOnly, `SameSite=Lax` cookie rather than localStorage, to reduce exposure to XSS-based token theft.
- Sign-in returns a generic "Invalid email or password" message regardless of whether the email or the password was incorrect, to avoid user enumeration.
- All input is validated server-side via DTOs, independent of any frontend validation.
- The `password` field is excluded from query results by default (`select: false`) and only explicitly re-included where needed (credential verification during sign-in).

## AI Usage

See [AI.md](./AI.md) for details on how AI tools were used during development, including what was AI-assisted, what worked well, and what was corrected or reworked.
