# Server - Node.js Express API with MySQL

A RESTful API server built with Node.js, Express, and MySQL for user management with sorting capabilities. Sinon and Chai are used for testing.

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                 # MySQL database connection pool
├── services/
│   └── userService.js        # service that gets users from database 
├── test/
│   └── integration/
│       ├── routes.test.js       # stubs  pool.execute
│       └── stub-service.test.js # stubs userService
├── index.js                  # API server
├── package.json              # Project dependencies and scripts
└── .env                      # Environment variables (not included in repo)
```

## 🚀 Features

- **RESTful API** with Express.js
- **MySQL Database** integration with connection pooling
- **User Management** endpoints
- **Sorting** functionality by user points

## 📋 API Endpoints

### GET `/api/v1/users`
- **Description**: Retrieve all users from the database
- **Response**: Array of user objects
- **Test**: `curl localhost:3000/api/v1/users`

### GET `/api/v1/sortedusers`
- **Description**: Retrieve users sorted by points
- **Query Parameters**:
  - `order` (optional): `asc` for ascending, any other value for descending
- **Response**: Array of user objects sorted by points
- **Test**: `curl "localhost:3000/api/v1/sortedusers?order=asc"`

## 🛠️ Installation & Setup

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with your MySQL database credentials:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=your_database
   ```

4. **Database Setup**
   Ensure you have a MySQL database with a `users` table containing at least the following columns:
   - `id` (INT)
   - `username` (VARCHAR)
   - `email` (VARCHAR) 
   - `points` (INT)

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm start
```
Uses nodemon for automatic restart on file changes.

## 🧪 Testing

Run the test suite:
```bash
npm run test:mocha
```

### Test Structure
- **Integration Tests**: Test API routes with database stubs
- **Service Tests**: Test business logic with service layer stubs
- **Stub-based Testing**: Uses Sinon for mocking database interactions

## 📦 Dependencies

### Runtime Dependencies
- `express`: Web framework
- `mysql2`: MySQL database client
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

### Development Dependencies
- `mocha`: Test framework
- `chai`: Assertion library
- `sinon`: Test spies, stubs, and mocks
- `supertest`: HTTP assertion testing
- `nodemon`: Development server with auto-restart

## 🔧 Configuration

### Server
- Port: 3000
- API base path: `/api/v1`

## 🎯 Usage Examples

### Get All Users
```bash
curl http://localhost:3000/api/v1/users
```

### Get Users Sorted by Points (Ascending)
```bash
curl "http://localhost:3000/api/v1/sortedusers?order=asc"
```

### Get Users Sorted by Points (Descending - Default)
```bash
curl http://localhost:3000/api/v1/sortedusers
```

## 🔍 Code Quality

- Modular architecture with separation of concerns
- Service layer for business logic
- Comprehensive test coverage
- Error handling for database operations
- Environment-based configuration
