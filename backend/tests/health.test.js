import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB, validateMongoURI, getDatabaseStatus } from '../src/config/db.js';

describe('Phase 1 - Database Configuration & URI Validation', () => {
  test('should reject empty or undefined MongoDB URI', () => {
    const resultEmpty = validateMongoURI('');
    assert.strictEqual(resultEmpty.valid, false);
    assert.match(resultEmpty.reason, /MONGODB_URI is not defined/);

    const resultUndefined = validateMongoURI(undefined);
    assert.strictEqual(resultUndefined.valid, false);
  });

  test('should detect placeholder tokens in MongoDB URI', () => {
    const placeholderUri = 'mongodb+srv://<username>:<password>@<cluster-url>/student_db?retryWrites=true&w=majority';
    const result = validateMongoURI(placeholderUri);
    assert.strictEqual(result.valid, false);
    assert.match(result.reason, /placeholder tokens/);
    assert.match(result.reason, /<username>/);
    assert.match(result.reason, /<password>/);
  });

  test('should accept a valid MongoDB URI format', () => {
    const validLocalUri = 'mongodb://127.0.0.1:27017/student_db';
    const result = validateMongoURI(validLocalUri);
    assert.strictEqual(result.valid, true);
  });
});

import dotenv from 'dotenv';
dotenv.config();

describe('Phase 1 - API Health & Database Integration', () => {
  const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_test_phase1';

  before(async () => {
    // Attempt connection for test suite
    try {
      await connectDB(TEST_DB_URI);
    } catch (err) {
      console.warn('Test setup: Database connection was not established (may be offline).', err.message);
    }
  });

  after(async () => {
    await disconnectDB();
  });

  test('GET / should return 200 with API metadata', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, 'Student Information Management System API');
    assert.strictEqual(res.body.healthCheck, '/api/health');
  });

  test('GET /api/health should return system status and database state', async () => {
    const res = await request(app).get('/api/health');
    const dbStatus = getDatabaseStatus();

    if (dbStatus.status === 'connected') {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'UP');
      assert.strictEqual(res.body.database.status, 'connected');
    } else {
      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.status, 'DEGRADED');
    }

    assert.ok(typeof res.body.uptime === 'number');
    assert.ok(res.body.timestamp);
    assert.strictEqual(res.body.service, 'Student Information Management System - Backend API');
  });

  test('GET /unknown-route should return 404 JSON response', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'NotFound');
  });
});
