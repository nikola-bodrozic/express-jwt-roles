// test/integration/routes.test.js
const chai      = require('chai');
const supertest = require('supertest');
const sinon     = require('sinon');
const jwt       = require('jsonwebtoken');

const { expect } = chai;
chai.use(require('sinon-chai').default || require('sinon-chai'));

const { app }   = require('../../index');
const pool      = require('../../config/db');

const request   = supertest(app);
const poolStub  = sinon.stub(pool, 'execute');

// Mock JWT token for testing
const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
const mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret', { 
  expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
});

beforeEach(() => poolStub.resetHistory());
after(()      => sinon.restore());

// Route: GET /api/v1/users
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

  it('returns all users when valid token provided', async () => {
    const mockUsers = [{ id: 1, username: 'john', email: 'j@d.com', points: 50 }];
    poolStub.resolves([mockUsers]);

    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);

    expect(res.body).to.deep.equal(mockUsers);
    expect(poolStub).to.have.been.calledOnceWithExactly('SELECT id, username, email, points FROM users');
  });
});

// Route: GET /api/v1/sortedusers
describe('GET /api/v1/sortedusers', () => {
  const mockDesc = [
    { id: 3, username: 'zebra', email: 'z@e.com', points: 999 },
    { id: 1, username: 'alice', email: 'a@b.com', points: 100 }
  ];
  const mockAsc = mockDesc.slice().reverse();

  it('returns 401 when no token provided', async () => {
    await request.get('/api/v1/sortedusers').expect(401);
  });

  it('returns users sorted DESC by default with valid token', async () => {
    poolStub.resolves([mockDesc]);

    const res = await request
      .get('/api/v1/sortedusers')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);

    expect(res.body).to.deep.equal(mockDesc);
    expect(poolStub).to.have.been.calledWithMatch(/ORDER BY points DESC/);
  });

  it('respects ?order=asc query parameter with valid token', async () => {
    poolStub.resolves([mockAsc]);

    await request
      .get('/api/v1/sortedusers?order=asc')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);

    expect(poolStub).to.have.been.calledWithMatch(/ORDER BY points ASC/);
  });

  it('falls back to DESC when order param is invalid with valid token', async () => {
    poolStub.resolves([mockDesc]);

    await request
      .get('/api/v1/sortedusers?order=whatever')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);

    expect(poolStub).to.have.been.calledWithMatch(/DESC/);
  });
});