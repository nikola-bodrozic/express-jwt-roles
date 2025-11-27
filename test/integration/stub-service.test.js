// test/integration/stub-service.test.js
const chai = require('chai');
const supertest = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
chai.use(require('sinon-chai').default || require('sinon-chai'));
const { expect } = chai;

const userService = require('../../services/userService');
const { app } = require('../../index');

describe('stub userService GET /api/v1/sortedusers', () => {
  let request;
  let sortUsersStub;

  // Mock JWT token for testing
  const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
  const mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret', { 
    expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
  });

  beforeEach(() => {
    sortUsersStub = sinon.stub(userService, 'sortUsers');
    request = supertest(app);
  });

  afterEach(() => {
    sinon.restore();
  });

  const mockDesc = [
    { id: 3, username: 'zebra', email: 'z@e.com', points: 999 },
    { id: 1, username: 'alice', email: 'a@b.com', points: 100 }
  ];
  const mockAsc = mockDesc.slice().reverse();

  it('returns 401 when no token provided', async () => {
    await request.get('/api/v1/sortedusers').expect(401);
  });

  it('returns users sorted DESC by default with valid token', async () => {
    sortUsersStub.withArgs('DESC').resolves(mockDesc);

    const res = await request
      .get('/api/v1/sortedusers')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);

    expect(res.body).to.deep.equal(mockDesc);
    expect(sortUsersStub).to.have.been.calledWith('DESC');
  });

  it('respects ?order=asc query parameter with valid token', async () => {
    sortUsersStub.withArgs('ASC').resolves(mockAsc);

    const res = await request
      .get('/api/v1/sortedusers?order=asc')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);

    expect(res.body).to.deep.equal(mockAsc);
    expect(sortUsersStub).to.have.been.calledWith('ASC');
  });
});