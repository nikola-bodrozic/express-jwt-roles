// test/integration/routes.test.js
const chai      = require('chai');
const supertest = require('supertest');
const sinon     = require('sinon');

const { expect } = chai;
chai.use(require('sinon-chai').default || require('sinon-chai'));

const { app }   = require('../../index');
const pool      = require('../../config/db');

const request   = supertest(app);
const poolStub  = sinon.stub(pool, 'execute');

beforeEach(() => poolStub.resetHistory());
after(()      => sinon.restore());

// Route: GET /api/v1/users
describe('stub pool GET /api/v1/users', () => {
  it('returns all users when database query succeeds', async () => {
    const mockUsers = [{ id: 1, username: 'john', email: 'j@d.com', points: 50 }];
    poolStub.resolves([mockUsers]);

    const res = await request.get('/api/v1/users').expect(200);

    expect(res.body).to.deep.equal(mockUsers);
    expect(poolStub).to.have.been.calledOnceWithExactly('SELECT * FROM users');
  });
});

// Route: GET /api/v1/sortedusers
describe('GET /api/v1/sortedusers', () => {
  const mockDesc = [
    { id: 3, username: 'zebra', points: 999 },
    { id: 1, username: 'alice', points: 100 }
  ];
  const mockAsc = mockDesc.slice().reverse();

  it('returns users sorted DESC by default', async () => {
    poolStub.resolves([mockDesc]);

    const res = await request.get('/api/v1/sortedusers').expect(200);

    expect(res.body).to.deep.equal(mockDesc);
    expect(poolStub).to.have.been.calledWithMatch(/ORDER BY points DESC/);
  });

  it('respects ?order=asc query parameter', async () => {
    poolStub.resolves([mockAsc]);

    await request.get('/api/v1/sortedusers?order=asc').expect(200);

    expect(poolStub).to.have.been.calledWithMatch(/ORDER BY points ASC/);
  });

  it('falls back to DESC when order param is invalid', async () => {
    poolStub.resolves([mockDesc]);

    await request.get('/api/v1/sortedusers?order=whatever').expect(200);

    expect(poolStub).to.have.been.calledWithMatch(/DESC/);
  });
});