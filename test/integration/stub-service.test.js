// test/integration/stub-service.test.js

const chai = require('chai');
const supertest = require('supertest');
const sinon = require('sinon');
chai.use(require('sinon-chai').default || require('sinon-chai'));
const { expect } = chai;

const userService = require('../../services/userService');
const { app } = require('../../index');

describe('stub userService GET /api/v1/sortedusers', () => {
  let request;
  let sortUsersStub;

  beforeEach(() => {
    sortUsersStub = sinon.stub(userService, 'sortUsers');
    request = supertest(app);
  });

  afterEach(() => {
    sinon.restore();
  });

  const mockDesc = [
    { id: 3, username: 'zebra', points: 999 },
    { id: 1, username: 'alice', points: 100 }
  ];
  const mockAsc = mockDesc.slice().reverse();

  it('returns users sorted DESC by default', async () => {
    sortUsersStub.withArgs('DESC').resolves(mockDesc);
    sortUsersStub.withArgs(sinon.match.any).resolves(mockDesc); // fallback

    const res = await request.get('/api/v1/sortedusers').expect(200);
    expect(res.body).to.deep.equal(mockDesc);
    expect(sortUsersStub).to.have.been.calledWith('DESC');
  });

  it('respects ?order=asc query parameter', async () => {
    sortUsersStub.withArgs('ASC').resolves(mockAsc);

    const res = await request.get('/api/v1/sortedusers?order=asc').expect(200);
    expect(res.body).to.deep.equal(mockAsc);
    expect(sortUsersStub).to.have.been.calledWith('ASC');
  });
});