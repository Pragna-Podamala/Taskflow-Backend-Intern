# 🚀 Backend API with Auth & RBAC

This project is a scalable REST API with authentication, role-based access control, and a simple frontend to interact with APIs.

## 🔐 Features

* User registration & login (JWT + bcrypt)
* Role-based access (User / Admin)
* CRUD APIs for Tasks
* Protected routes & middleware
* Input validation & error handling

## 🗄️ Tech Stack

* Node.js, Express
* MongoDB (Mongoose)
* React (Frontend)
* JWT Authentication

## ⚡ Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `.env`:

```
PORT=5000
MONGO_URI=your_db_uri
JWT_SECRET=your_secret
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔗 API Routes

* POST `/api/v1/auth/register`
* POST `/api/v1/auth/login`
* GET `/api/v1/tasks`
* POST `/api/v1/tasks`

## 🧪 Testing

* Swagger: `/api-docs`
* Postman collection included

## 📈 Scalability

Modular structure with middleware, ready for scaling using caching, Docker, or microservices.

---
