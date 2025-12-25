// test/integration/routes.test.js
const chai = require('chai');
const supertest = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { expect } = chai;

chai.use(require('sinon-chai').default || require('sinon-chai'));

const { app } = require('../../index');
const pool = require('../../config/db');
const { JWT_SECRET } = require('../../middleware/auth');
const request = supertest(app);

let poolStub;

// Mock tokens for different roles
const mockDeveloper = { id: 1, username: 'devuser', email: 'dev@example.com', role: 'developer' };
const mockQaTester = { id: 2, username: 'qatester', email: 'qa@example.com', role: 'qatester' };
const mockAdmin = { id: 3, username: 'adminuser', email: 'admin@example.com', role: 'admin' };

const mockDeveloperToken = jwt.sign(mockDeveloper, JWT_SECRET, { expiresIn: '24h' });
const mockQaToken = jwt.sign(mockQaTester, JWT_SECRET, { expiresIn: '24h' });
const mockAdminToken = jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '24h' });

describe('Integration Tests', () => {
  beforeEach(() => {
    // Stub pool.execute if not already stubbed
    if (!pool.execute.restore) {
      poolStub = sinon.stub(pool, 'execute');
    } else {
      poolStub = pool.execute;
      poolStub.resetHistory();
    }

    // Default behavior: token is NOT blacklisted
    poolStub.callsFake(async (sql, params) => {
      if (sql.includes('sw_tokens') && sql.includes('SELECT')) {
        return [[]]; // Not blacklisted
      }
      return [[]]; // Default empty for other unexpected queries
    });
  });

  after(() => {
    sinon.restore();
  });

  describe('Authentication Token Validation', () => {
    it('returns 401 when an expired token is provided', async () => {
      const payload = { id: 1, username: 'testuser', email: 'test@example.com', role: 'developer' };
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

      const res = await request
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.error).to.equal('Token expired');
    });

    it('returns 401 when an invalidated token is provided', async () => {
      const payload = { id: 1, username: 'testuser', email: 'test@example.com', role: 'developer' };
      const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      poolStub.withArgs(
        sinon.match(/SELECT id FROM sw_tokens WHERE token = \? AND is_invalidated = 1/),
        [validToken]
      ).resolves([[{ id: 1 }]]);

      const res = await request
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);

      expect(res.body.error).to.equal('Token has been invalidated');
    });
  });

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

      poolStub.withArgs(
        "SELECT id, username, email, points FROM users WHERE role = ?",
        [mockDeveloper.role]
      ).resolves([mockUsers]);

      const res = await request
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${mockDeveloperToken}`)
        .expect(200);

      expect(res.body).to.deep.equal(mockUsers);
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
        .set('Authorization', `Bearer ${mockDeveloperToken}`)
        .expect(403);
    });

    it('returns all users when valid admin token provided', async () => {
      const mockAllUsers = [
        { id: 1, username: 'dev1', email: 'dev1@example.com', password: 'hash', role: 'developer', points: 50 },
        { id: 2, username: 'qa1', email: 'qa1@example.com', password: 'hash', role: 'qatester', points: 100 },
        { id: 3, username: 'admin', email: 'admin@example.com', password: 'hash', role: 'admin', points: 0 }
      ];

      poolStub.withArgs("SELECT * FROM users").resolves([mockAllUsers]);

      const res = await request
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200);

      expect(res.body).to.deep.equal(mockAllUsers);
    });
  });

  // Route: DELETE /api/v1/admin/users/:userId (admin only)
  describe('DELETE /api/v1/admin/users/:userId', () => {
    const userIdToDelete = "5";

    it('returns 401 when no token provided', async () => {
      await request.delete(`/api/v1/admin/users/${userIdToDelete}`).expect(401);
    });

    it('returns 403 when non-admin token provided', async () => {
      await request
        .delete(`/api/v1/admin/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${mockQaToken}`)
        .expect(403);
    });

    it('deletes user successfully when valid admin token provided', async () => {
      poolStub.withArgs("DELETE FROM users WHERE id = ?", [userIdToDelete])
        .resolves([{ affectedRows: 1 }]);

      await request
        .delete(`/api/v1/admin/users/${userIdToDelete}`)
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).to.deep.equal({ message: "User deleted successfully" });
        });
    });
  });

  // Route: PUT /api/v1/admin/users/:userId/points (admin only)
  describe('PUT /api/v1/admin/users/:userId/points', () => {
    const userIdToUpdate = "7";
    const newPointsValue = 250;

    it('returns 401 when no token provided', async () => {
      await request.put(`/api/v1/admin/users/${userIdToUpdate}/points`).send({ points: newPointsValue }).expect(401);
    });

    it('returns 403 when non-admin token provided', async () => {
      await request
        .put(`/api/v1/admin/users/${userIdToUpdate}/points`)
        .send({ points: newPointsValue })
        .set('Authorization', `Bearer ${mockDeveloperToken}`)
        .expect(403);
    });

    it('updates user points successfully when valid admin token provided', async () => {
      poolStub.withArgs("UPDATE users SET points = ? WHERE id = ?", [newPointsValue, userIdToUpdate])
        .resolves([{ affectedRows: 1 }]);

      await request
        .put(`/api/v1/admin/users/${userIdToUpdate}/points`)
        .send({ points: newPointsValue })
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .expect(200)
        .then(res => {
          expect(res.body).to.deep.equal({ message: "User points updated successfully" });
        });
    });
  });
});