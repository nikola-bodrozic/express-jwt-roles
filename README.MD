# 🚀 User Management API Framework

A robust Node.js Express API with JWT authentication, role-based access control, and comprehensive user management features.

## 📋 Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Development](#development)

## ✨ Features

- 🔐 **JWT Authentication** with configurable expiration
- 👥 **Role-Based Access Control** (Admin/Developer/QA tester)
- 🛡️ **Password Security** with bcrypt hashing
- 🗄️ **MySQL Database** with connection pooling
- 🧪 **Comprehensive Testing** with Mocha, Chai, Sinon
- 🔒 **Protected Routes** with middleware
- 🌐 **CORS Enabled** for cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js (v20 or higher)
- MySQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.sample .env
# Edit .env with your database credentials and JWT secret and expiry time
```

3. **Database setup**
```sql
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `points` int NOT NULL DEFAULT '0',
  `password` varchar(255) NOT NULL,
  `role` enum('admin','developer','qatester') DEFAULT 'developer',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

insert admin 

```sql
INSERT INTO users (username, email, points, password, role) VALUES
('admin', 'admin@example.com', 0, '$2b$10$FUSudxynZyi1UOOa5UzZ9ediLR89G9YzwAXlTVVQoxiU33FvVVFvu', 'admin');
```

password is `pass`

4. **Start the server**
```bash
yarn start
```

## 📡 API Endpoints

### 🔓 Public Routes

#### Register New User
```bash
curl -X POST http://localhost:3000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "pass",
    "role":"developer"
  }'
```

#### User Login
```bash
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "pass"
  }'
```

### 🔒 Protected User Routes

#### Get All Users from the role
```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 👑 Admin Routes

#### Get All Users (Admin View)
```bash
curl http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update User Points
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/8/points \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points": 150}'
```

#### Delete User
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/users/8 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔐 Authentication

### JWT Token Flow
1. **Register/Login** to receive JWT token
2. **Include token** in request headers: `Authorization: Bearer <token>`
3. **Access protected routes** based on user role

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm run test:mocha
```

### Test Coverage
- ✅ Authentication middleware
- ✅ Route protection
- ✅ Role-based access control
- ✅ Database operations
- ✅ Error handling

## 📁 Project Structure

```
server2/
├── config/
│   └── db.js                 # Database connection pool
├── middleware/
│   ├── auth.js              # JWT authentication
├── services/
│   ├── authService.js       # Authentication logic
├── test/
│   └── integration/         # Comprehensive test suite
├── index.js                 # Main application entry
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

## 🛠️ Development

### Scripts
```bash
npm install
npm start   # Start development server with nodemon
npm run test:mocha # Run test suite
```

### Dependencies
- **express** - Web framework
- **mysql2** - MySQL database client
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Development Dependencies
- **mocha** - Test framework
- **chai** - Assertion library
- **sinon** - Test spies and stubs
- **supertest** - HTTP testing
- **nodemon** - Development server

## 🔧 Framework Features

### Security
- JWT token with configurable expiration
- Password hashing with bcrypt
- SQL injection protection via parameterized queries
- Role-based route protection
