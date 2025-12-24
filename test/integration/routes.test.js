// test/integration/routes.test.js
const chai = require('chai');
const supertest = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { expect } = chai;

chai.use(require('sinon-chai').default || require('sinon-chai'));

const { app } = require('../../index');
const pool = require('../../config/db');
const request = supertest(app);

const poolStub = sinon.stub(pool, 'execute');

// Mock tokens for different roles
const mockDeveloper = { id: 1, username: 'devuser', email: 'dev@example.com', role: 'developer' };
const mockQaTester = { id: 2, username: 'qatester', email: 'qa@example.com', role: 'qatester' };
const mockAdmin = { id: 3, username: 'adminuser', email: 'admin@example.com', role: 'admin' };

const mockDeveloperToken = jwt.sign(mockDeveloper, process.env.JWT_SECRET || 'test-secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
});
const mockQaToken = jwt.sign(mockQaTester, process.env.JWT_SECRET || 'test-secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
});
const mockAdminToken = jwt.sign(mockAdmin, process.env.JWT_SECRET || 'test-secret', {
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
});

beforeEach(() => poolStub.resetHistory());
after(() => sinon.restore());

// Route: GET /api/v1/users (returns users matching the authenticated user's role)
describe('GET /api/v1/users', () => {
  it('returns 401 when no token provided', async () => {
    await request.get('/api/v1/users').expect(401);
  });

  it('returns 403 when invalid token provided', async () => {
    await request
      .get('/api/v1/users')
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);
  });

  it('returns users matching the authenticated user\'s role', async () => {
    const mockUsers = [
      { id: 1, username: 'dev1', email: 'dev1@example.com', points: 50 },
      { id: 2, username: 'dev2', email: 'dev2@example.com', points: 30 }
    ];

    // Stub the pool to return users matching the role 'developer'
    poolStub.resolves([mockUsers]);

    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${mockDeveloperToken}`) // Authenticated as a developer
      .expect(200);

    expect(res.body).to.deep.equal(mockUsers);
    // The query should filter by the role of the authenticated user
    expect(poolStub).to.have.been.calledOnceWithExactly(
      "SELECT id, username, email, points FROM users WHERE role = ?",
      [mockDeveloper.role] // Pass the role from the token
    );
  });
});

// Route: GET /api/v1/admin/users (admin only)
describe('GET /api/v1/admin/users', () => {
  it('returns 401 when no token provided', async () => {
    await request.get('/api/v1/admin/users').expect(401);
  });

  it('returns 403 when non-admin token provided', async () => {
    await request
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${mockDeveloperToken}`) // Developer token
      .expect(401); // Should be 401 based on your code ("Not authorised")
  });

  it('returns 403 when invalid token provided', async () => {
    await request
      .get('/api/v1/admin/users')
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);
  });

  it('returns all users when valid admin token provided', async () => {
    const mockAllUsers = [
      { id: 1, username: 'dev1', email: 'dev1@example.com', password: 'hash', role: 'developer', points: 50 },
      { id: 2, username: 'qa1', email: 'qa1@example.com', password: 'hash', role: 'qatester', points: 100 },
      { id: 3, username: 'admin', email: 'admin@example.com', password: 'hash', role: 'admin', points: 0 }
    ];

    poolStub.resolves([mockAllUsers]);

    const res = await request
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${mockAdminToken}`) // Admin token
      .expect(200);

    expect(res.body).to.deep.equal(mockAllUsers);
    expect(poolStub).to.have.been.calledOnceWithExactly("SELECT * FROM users");
  });
});

// Route: DELETE /api/v1/admin/users/:userId (admin only)
describe('DELETE /api/v1/admin/users/:userId', () => {
  const userIdToDelete = "5"; // Define as string to match req.params

  it('returns 401 when no token provided', async () => {
    await request.delete(`/api/v1/admin/users/${userIdToDelete}`).expect(401);
  });

  it('returns 401 when non-admin token provided', async () => {
    await request
      .delete(`/api/v1/admin/users/${userIdToDelete}`)
      .set('Authorization', `Bearer ${mockQaToken}`) // QA token
      .expect(401); // Should be 401 based on your code ("Not authorised")
  });

  it('returns 403 when invalid token provided', async () => {
    await request
      .delete(`/api/v1/admin/users/${userIdToDelete}`)
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);
  });

  it('deletes user successfully when valid admin token provided', async () => {
    // Stub to simulate one affected row (user found and deleted)
    poolStub.resolves([{ affectedRows: 1 }]);

    await request
      .delete(`/api/v1/admin/users/${userIdToDelete}`)
      .set('Authorization', `Bearer ${mockAdminToken}`) // Admin token
      .expect(200)
      .then(res => {
        expect(res.body).to.deep.equal({ message: "User deleted successfully" });
      });

    // Expect the userId to be passed as a string
    expect(poolStub).to.have.been.calledOnceWithExactly("DELETE FROM users WHERE id = ?", [userIdToDelete]);
  });

  it('returns 404 if user to delete is not found', async () => {
    // Stub to simulate zero affected rows (user not found)
    poolStub.resolves([{ affectedRows: 0 }]);

    await request
      .delete(`/api/v1/admin/users/${userIdToDelete}`)
      .set('Authorization', `Bearer ${mockAdminToken}`) // Admin token
      .expect(404)
      .then(res => {
        expect(res.body).to.deep.equal({ error: "User not found" });
      });
  });
});

// Route: PUT /api/v1/admin/users/:userId/points (admin only)
describe('PUT /api/v1/admin/users/:userId/points', () => {
  const userIdToUpdate = "7"; // Define as string to match req.params
  const newPointsValue = 250; // Keep as number, likely sent as number in JSON body

  it('returns 401 when no token provided', async () => {
    await request.put(`/api/v1/admin/users/${userIdToUpdate}/points`).send({ points: newPointsValue }).expect(401);
  });

  it('returns 401 when non-admin token provided', async () => {
    await request
      .put(`/api/v1/admin/users/${userIdToUpdate}/points`)
      .send({ points: newPointsValue })
      .set('Authorization', `Bearer ${mockDeveloperToken}`) // Developer token
      .expect(401); // Should be 401 based on your code ("Not authorised")
  });

  it('returns 403 when invalid token provided', async () => {
    await request
      .put(`/api/v1/admin/users/${userIdToUpdate}/points`)
      .send({ points: newPointsValue })
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);
  });

  it('updates user points successfully when valid admin token provided', async () => {
    // Stub to simulate one affected row (user found and updated)
    poolStub.resolves([{ affectedRows: 1 }]);

    await request
      .put(`/api/v1/admin/users/${userIdToUpdate}/points`)
      .send({ points: newPointsValue })
      .set('Authorization', `Bearer ${mockAdminToken}`) // Admin token
      .expect(200)
      .then(res => {
        expect(res.body).to.deep.equal({ message: "User points updated successfully" });
      });

    // Expect the userId to be passed as a string, and points as the number
    expect(poolStub).to.have.been.calledOnceWithExactly(
      "UPDATE users SET points = ? WHERE id = ?",
      [newPointsValue, userIdToUpdate] // [number, string]
    );
  });

  it('returns 404 if user to update points for is not found', async () => {
    // Stub to simulate zero affected rows (user not found)
    poolStub.resolves([{ affectedRows: 0 }]);

    await request
      .put(`/api/v1/admin/users/${userIdToUpdate}/points`)
      .send({ points: newPointsValue })
      .set('Authorization', `Bearer ${mockAdminToken}`) // Admin token
      .expect(404)
      .then(res => {
        expect(res.body).to.deep.equal({ error: "User not found" });
      });
  });
});