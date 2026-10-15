import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

import app from '../src/app.js';
import Student from '../src/models/Student.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

describe('Phase 2 - Student CRUD API Integration Tests', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    // Cleanup created test records
    await Student.deleteMany({ studentId: /^TEST-/ });
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean test student records before each test
    await Student.deleteMany({ studentId: /^TEST-/ });
  });

  // ========================================================
  // 1. POST /api/students (Create)
  // ========================================================
  describe('POST /api/students', () => {
    test('should create a new student with valid data (201 Created)', async () => {
      const payload = {
        studentId: 'TEST-001',
        name: 'John Doe',
        email: 'john.doe.test@example.com',
        department: 'Computer Science',
        semester: 3,
        contact: '+1-555-123-4567',
      };

      const res = await request(app)
        .post('/api/students')
        .send(payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, 'TEST-001');
      assert.strictEqual(res.body.data.name, 'John Doe');
      assert.strictEqual(res.body.data.email, 'john.doe.test@example.com');
      assert.strictEqual(res.body.data.semester, 3);
      assert.ok(res.body.data._id);
      assert.ok(res.body.data.createdAt);
      assert.ok(res.body.data.updatedAt);
    });

    test('should reject creation when required fields are missing (400 Bad Request)', async () => {
      const payload = {
        name: 'Incomplete Student',
      };

      const res = await request(app)
        .post('/api/students')
        .send(payload);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'ValidationError');
      assert.ok(Array.isArray(res.body.errors));
      assert.ok(res.body.errors.some((e) => e.includes('studentId is required')));
      assert.ok(res.body.errors.some((e) => e.includes('email is required')));
    });

    test('should reject creation with invalid email format (400 Bad Request)', async () => {
      const payload = {
        studentId: 'TEST-002',
        name: 'Invalid Email User',
        email: 'invalid-email-address',
        department: 'Information Technology',
        semester: 2,
      };

      const res = await request(app)
        .post('/api/students')
        .send(payload);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.errors.some((e) => e.includes('email must be a valid email')));
    });

    test('should reject creation with semester out of range (400 Bad Request)', async () => {
      const payload = {
        studentId: 'TEST-003',
        name: 'Out of Range Semester',
        email: 'sem.test@example.com',
        department: 'Civil Engineering',
        semester: 15,
      };

      const res = await request(app)
        .post('/api/students')
        .send(payload);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.errors.some((e) => e.includes('semester must be an integer between 1 and 12')));
    });

    test('should reject duplicate studentId (409 Conflict)', async () => {
      const payload1 = {
        studentId: 'TEST-DUP',
        name: 'First Student',
        email: 'first@example.com',
        department: 'Electronics',
        semester: 1,
      };

      const payload2 = {
        studentId: 'TEST-DUP',
        name: 'Duplicate Student',
        email: 'second@example.com',
        department: 'Mechanical',
        semester: 2,
      };

      const res1 = await request(app).post('/api/students').send(payload1);
      assert.strictEqual(res1.status, 201);

      const res2 = await request(app).post('/api/students').send(payload2);
      assert.strictEqual(res2.status, 409);
      assert.strictEqual(res2.body.success, false);
      assert.strictEqual(res2.body.error, 'Conflict');
      assert.strictEqual(res2.body.field, 'studentId');
    });

    test('should reject duplicate email (409 Conflict)', async () => {
      const payload1 = {
        studentId: 'TEST-EMAIL-1',
        name: 'Student A',
        email: 'shared.email@example.com',
        department: 'Computer Science',
        semester: 4,
      };

      const payload2 = {
        studentId: 'TEST-EMAIL-2',
        name: 'Student B',
        email: 'shared.email@example.com',
        department: 'Electrical',
        semester: 3,
      };

      const res1 = await request(app).post('/api/students').send(payload1);
      assert.strictEqual(res1.status, 201);

      const res2 = await request(app).post('/api/students').send(payload2);
      assert.strictEqual(res2.status, 409);
      assert.strictEqual(res2.body.error, 'Conflict');
      assert.strictEqual(res2.body.field, 'email');
    });
  });

  // ========================================================
  // 2. GET /api/students (Read All & Filtering)
  // ========================================================
  describe('GET /api/students', () => {
    beforeEach(async () => {
      await Student.create([
        {
          studentId: 'TEST-CS-01',
          name: 'Alan Turing',
          email: 'alan.turing@test.com',
          department: 'Computer Science',
          semester: 5,
        },
        {
          studentId: 'TEST-CS-02',
          name: 'Ada Lovelace',
          email: 'ada.lovelace@test.com',
          department: 'Computer Science',
          semester: 6,
        },
        {
          studentId: 'TEST-EE-01',
          name: 'Nikola Tesla',
          email: 'nikola.tesla@test.com',
          department: 'Electrical Engineering',
          semester: 4,
        },
      ]);
    });

    test('should return all students with pagination metadata (200 OK)', async () => {
      const res = await request(app).get('/api/students');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.length >= 3);
      assert.ok(res.body.pagination);
      assert.strictEqual(res.body.pagination.page, 1);
    });

    test('should filter students by department', async () => {
      const res = await request(app).get('/api/students?department=Computer%20Science');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const allCS = res.body.data.every((s) => s.department === 'Computer Science');
      assert.strictEqual(allCS, true);
    });

    test('should search students across studentId, name, or email', async () => {
      const res = await request(app).get('/api/students?search=Turing');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].studentId, 'TEST-CS-01');
    });
  });

  // ========================================================
  // 3. GET /api/students/:id (Read One)
  // ========================================================
  describe('GET /api/students/:id', () => {
    let createdStudent;

    beforeEach(async () => {
      createdStudent = await Student.create({
        studentId: 'TEST-GET-01',
        name: 'Grace Hopper',
        email: 'grace.hopper@test.com',
        department: 'Computer Science',
        semester: 7,
      });
    });

    test('should retrieve an existing student by ID (200 OK)', async () => {
      const res = await request(app).get(`/api/students/${createdStudent._id}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, 'TEST-GET-01');
      assert.strictEqual(res.body.data.name, 'Grace Hopper');
    });

    test('should return 400 Bad Request for malformed MongoDB ObjectId', async () => {
      const res = await request(app).get('/api/students/invalid-mongo-id-123');

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'InvalidId');
    });

    test('should return 404 Not Found for non-existent valid ObjectId', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/students/${nonExistentId}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'NotFound');
    });
  });

  // ========================================================
  // 4. PUT /api/students/:id (Update)
  // ========================================================
  describe('PUT /api/students/:id', () => {
    let studentA;
    let studentB;

    beforeEach(async () => {
      studentA = await Student.create({
        studentId: 'TEST-PUT-A',
        name: 'Katherine Johnson',
        email: 'katherine.johnson@test.com',
        department: 'Mathematics',
        semester: 4,
      });

      studentB = await Student.create({
        studentId: 'TEST-PUT-B',
        name: 'Dorothy Vaughan',
        email: 'dorothy.vaughan@test.com',
        department: 'Computing',
        semester: 5,
      });
    });

    test('should update student details successfully (200 OK)', async () => {
      const updates = {
        semester: 6,
        contact: '+1-555-999-8888',
        department: 'Applied Mathematics',
      };

      const res = await request(app)
        .put(`/api/students/${studentA._id}`)
        .send(updates);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.semester, 6);
      assert.strictEqual(res.body.data.contact, '+1-555-999-8888');
      assert.strictEqual(res.body.data.department, 'Applied Mathematics');
    });

    test('should return 400 when update body is empty', async () => {
      const res = await request(app)
        .put(`/api/students/${studentA._id}`)
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'ValidationError');
    });

    test('should return 400 when updating with invalid email', async () => {
      const res = await request(app)
        .put(`/api/students/${studentA._id}`)
        .send({ email: 'bad-email' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'ValidationError');
    });

    test('should return 409 Conflict when updating studentId to one already in use', async () => {
      const res = await request(app)
        .put(`/api/students/${studentA._id}`)
        .send({ studentId: 'TEST-PUT-B' });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error, 'Conflict');
      assert.strictEqual(res.body.field, 'studentId');
    });

    test('should return 404 when updating non-existent student', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/students/${nonExistentId}`)
        .send({ semester: 8 });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'NotFound');
    });
  });

  // ========================================================
  // 5. DELETE /api/students/:id (Delete)
  // ========================================================
  describe('DELETE /api/students/:id', () => {
    let studentToDelete;

    beforeEach(async () => {
      studentToDelete = await Student.create({
        studentId: 'TEST-DEL-01',
        name: 'Temporary Student',
        email: 'temp.del@test.com',
        department: 'Biotechnology',
        semester: 1,
      });
    });

    test('should delete student successfully (200 OK)', async () => {
      const res = await request(app).delete(`/api/students/${studentToDelete._id}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.studentId, 'TEST-DEL-01');

      // Verify record is gone
      const verifyRes = await request(app).get(`/api/students/${studentToDelete._id}`);
      assert.strictEqual(verifyRes.status, 404);
    });

    test('should return 400 Bad Request for malformed ObjectId on DELETE', async () => {
      const res = await request(app).delete('/api/students/not-a-valid-id');

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'InvalidId');
    });

    test('should return 404 Not Found for non-existent student on DELETE', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app).delete(`/api/students/${nonExistentId}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'NotFound');
    });
  });
});
