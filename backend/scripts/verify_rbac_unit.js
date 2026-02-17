import { authorizeRoles } from '../src/middlewares/authorizeRoles.js';
import { checkOwnership } from '../src/middlewares/checkOwnership.js';

// Simple test runner
const runTest = async (name, testFn) => {
  try {
    await testFn();
    console.log(`✅ ${name} passed`);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    process.exit(1);
  }
};

const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const createMockNext = () => {
  return () => {
    return 'next_called';
  };
};

// Tests
(async () => {
  console.log('Running RBAC Unit Tests...\n');

  // 1. authorizeRoles
  await runTest('authorizeRoles: user accessing admin route should fail', async () => {
    const req = { user: { role: 'user' } };
    const res = createMockRes();
    const next = createMockNext();

    const middleware = authorizeRoles('admin');
    await middleware(req, res, next);

    if (res.statusCode !== 403) throw new Error(`Expected 403, got ${res.statusCode}`);
    if (res.body.message !== 'Access denied: insufficient permissions') throw new Error('Wrong error message');
  });

  await runTest('authorizeRoles: admin accessing admin route should pass', async () => {
    const req = { user: { role: 'admin' } };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = authorizeRoles('admin');
    await middleware(req, res, next);

    if (!nextCalled) throw new Error('Next was not called');
  });

  // 2. checkOwnership
  // Mock Model
  const mockResource = {
    _id: 'resource123',
    owner: 'user123',
    otherField: 'user123'
  };

  const MockModel = {
    findById: async (id) => {
      if (id === 'resource123') return mockResource;
      return null;
    }
  };

  await runTest('checkOwnership: resource not found should return 404', async () => {
    const req = { params: { id: 'missing' }, user: { _id: 'user123', role: 'user' } };
    const res = createMockRes();
    const next = createMockNext();

    const middleware = checkOwnership(MockModel); // uses default 'id' and 'owner'
    // checkOwnership returns a function that expects (req, res, next)
    // AND it is wrapped in asyncHandler.
    // asyncHandler(fn) returns (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

    // We need to await the execution of the returned middleware
    await middleware(req, res, next);

    if (res.statusCode !== 404) throw new Error(`Expected 404, got ${res.statusCode}`);
  });

  await runTest('checkOwnership: owner should pass', async () => {
    const req = { params: { id: 'resource123' }, user: { _id: 'user123', role: 'user' } };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = checkOwnership(MockModel);
    await middleware(req, res, next);

    if (!nextCalled) throw new Error('Next was not called for owner');
  });

  await runTest('checkOwnership: non-owner user should fail', async () => {
    const req = { params: { id: 'resource123' }, user: { _id: 'otherUser', role: 'user' } };
    const res = createMockRes();
    const next = createMockNext();

    const middleware = checkOwnership(MockModel);
    await middleware(req, res, next);

    if (res.statusCode !== 403) throw new Error(`Expected 403, got ${res.statusCode}`);
    if (res.body.message !== 'Access denied: you do not own this resource') throw new Error('Wrong error message');
  });

  await runTest('checkOwnership: admin (non-owner) should pass', async () => {
    const req = { params: { id: 'resource123' }, user: { _id: 'adminUser', role: 'admin' } };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = checkOwnership(MockModel);
    await middleware(req, res, next);

    if (!nextCalled) throw new Error('Next was not called for admin');
  });

  await runTest('checkOwnership: custom param and field should work', async () => {
    // Mock Model for this test
    const customResource = { _id: 'res1', user: 'u1' };
    const CustomModel = { findById: async () => customResource };

    const req = { params: { videoId: 'res1' }, user: { _id: 'u1', role: 'user' } };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = checkOwnership(CustomModel, 'videoId', 'user');
    await middleware(req, res, next);

    if (!nextCalled) throw new Error('Next was not called for custom param/field');
  });

  console.log('\nAll tests passed successfully!');
})();
