# ⚡ TaskFlow — Scalable REST API with JWT Auth & RBAC

A production-ready full-stack task management application demonstrating secure, scalable backend API design with a clean React frontend.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT (Access + Refresh tokens), bcryptjs |
| **Frontend** | React 18, React Router v6 |
| **Docs** | Swagger / OpenAPI 3.0 |
| **DevOps** | Docker, Docker Compose, Nginx |
| **Logging** | Winston |
| **Validation** | express-validator |
| **Rate Limiting** | express-rate-limit |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- npm or yarn

### 1. Clone & Setup Backend

```bash
cd backend
cp .env.example .env          # Fill in your values
npm install
npm run dev                   # Starts on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm start                     # Starts on http://localhost:3000
```

### 3. Docker (Full Stack)

```bash
# Copy and fill backend env
cp backend/.env.example backend/.env

# Build and run everything
docker-compose up --build

# Services:
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# API Docs: http://localhost:5000/api-docs
# MongoDB:  localhost:27017
# Redis:    localhost:6379
```

---

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CLIENT_URL=http://localhost:3000
```

---

## 📡 API Reference

### Base URL: `/api/v1`

#### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register user | Public |
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout | 🔒 |
| GET | `/auth/me` | Get profile | 🔒 |
| PATCH | `/auth/me` | Update profile | 🔒 |

#### ✅ Tasks (CRUD)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tasks` | List all tasks (paginated, filtered) | 🔒 |
| POST | `/tasks` | Create task | 🔒 |
| GET | `/tasks/stats` | Task statistics | 🔒 |
| GET | `/tasks/:id` | Get task by ID | 🔒 |
| PUT | `/tasks/:id` | Update task | 🔒 owner/admin |
| DELETE | `/tasks/:id` | Delete task | 🔒 owner/admin |

#### 🛡️ Admin (Admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Platform stats |
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:id` | Get user by ID |
| PATCH | `/admin/users/:id` | Update user role/status |
| DELETE | `/admin/users/:id` | Delete user |

#### Query Params (GET /tasks)

```
?page=1&limit=10
?status=todo|in-progress|completed|archived
?priority=low|medium|high|urgent
?search=keyword
?sortBy=createdAt&order=asc|desc
?tags=tag1,tag2
?dueBefore=2025-12-31&dueAfter=2025-01-01
```

### Standard Response Format

```json
{
  "success": true,
  "message": "Tasks fetched",
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 🗄️ Database Schema

### User
```
name        String (2-50 chars)
email       String (unique, indexed)
password    String (hashed, bcrypt rounds=12, never returned in API)
role        Enum: user | admin  (default: user)
isActive    Boolean (default: true)
refreshToken String (hashed, never returned in API)
lastLogin   Date
createdAt   Date
updatedAt   Date
```

### Task
```
title       String (3-100 chars)
description String (max 500 chars)
status      Enum: todo | in-progress | completed | archived
priority    Enum: low | medium | high | urgent
dueDate     Date (optional)
tags        [String] (max 10, each max 20 chars)
owner       ObjectId → User (indexed)
assignedTo  ObjectId → User (optional)
completedAt Date (auto-set on status=completed)
createdAt   Date
updatedAt   Date

Indexes: { owner, status }, { owner, priority }, { dueDate }, { tags }
```

---

## 🔒 Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT**: Short-lived access token (7d) + long-lived refresh token (30d)
- **Refresh token rotation**: New refresh token issued on each refresh
- **Rate limiting**: 100 req/15min globally; 20 req/15min on auth routes
- **Helmet**: Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Restricted to configured client origin
- **Input validation**: All inputs validated and sanitized via express-validator
- **Payload size limit**: 10kb max request body
- **Role-based access**: `protect` + `authorize` middleware chain
- **Password-change guard**: Tokens issued before password change are invalidated
- **Non-root Docker**: Container runs as unprivileged `nodeuser`

---

## 📐 Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection, Swagger config
│   │   ├── controllers/  # Business logic (auth, tasks, admin)
│   │   ├── middleware/   # auth, errorHandler, validate
│   │   ├── models/       # Mongoose schemas (User, Task)
│   │   ├── routes/       # Express routers with Swagger JSDoc
│   │   ├── utils/        # logger, response helpers
│   │   ├── validators/   # express-validator rule sets
│   │   └── server.js     # App entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, LoadingSpinner
│   │   ├── context/      # AuthContext (global auth state)
│   │   ├── pages/        # Login, Register, Dashboard, Tasks, Admin
│   │   ├── services/     # Axios API client with interceptors
│   │   └── App.js        # Router + protected routes
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## 📚 API Documentation

Interactive Swagger UI available at:
```
http://localhost:5000/api-docs
```

Authenticate in Swagger:
1. Call `POST /auth/login` → copy `accessToken`
2. Click **Authorize** button (top right)
3. Enter: `Bearer <your_token>`

---

## 📈 Scalability Notes

See [SCALABILITY.md](./SCALABILITY.md) for detailed architecture notes.

**Key scaling strategies implemented:**
- Stateless JWT (horizontal scaling ready)
- MongoDB indexes on all query-heavy fields
- Pagination on all list endpoints
- Compression middleware (Gzip)
- Modular route/controller architecture for adding new domains
- Docker + Docker Compose for containerized deployment
- Redis service included for future caching layer
- Nginx reverse proxy with static asset caching
# Taskflow-Backend-Intern
