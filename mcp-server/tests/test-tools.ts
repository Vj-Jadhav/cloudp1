import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectToDatabase, disconnectDatabase } from '../src/db/connection.js';
import { Student } from '../src/db/models/Student.js';
import { handleListStudents } from '../src/tools/listStudents.js';
import { handleGetStudent } from '../src/tools/getStudent.js';
import { handleCreateStudent } from '../src/tools/createStudent.js';
import { handleUpdateStudent } from '../src/tools/updateStudent.js';
import { handleDeleteStudent } from '../src/tools/deleteStudent.js';
import { handleStudentStatistics } from '../src/tools/studentStats.js';

async function runMcpVerification() {
  console.log('--- Starting MCP Server Tool Verification Suite ---');

  await connectToDatabase();

  const testStudentId = 'MCP-TEST-999';
  const testEmail = 'mcp.verification@university.edu';

  // Cleanup any lingering previous test records
  await Student.deleteMany({ studentId: testStudentId });

  try {
    // 1. Test get_student_statistics
    console.log('\n[1/7] Testing get_student_statistics...');
    const statsRes = await handleStudentStatistics({});
    assert.ok(statsRes.content[0].text);
    console.log('✔ get_student_statistics returned valid stats.');

    // 2. Test create_student
    console.log('\n[2/7] Testing create_student...');
    const createRes = await handleCreateStudent({
      studentId: testStudentId,
      name: 'Ada Lovelace',
      email: testEmail,
      department: 'Computer Science',
      semester: 4,
      contact: '+1-555-0199',
    });
    assert.strictEqual(createRes.isError, undefined);
    assert.ok(createRes.content[0].text.includes('Ada Lovelace'));
    console.log('✔ create_student created test student in MongoDB Atlas.');

    // 3. Test duplicate creation prevention
    console.log('\n[3/7] Testing create_student duplicate prevention...');
    const duplicateRes = await handleCreateStudent({
      studentId: testStudentId,
      name: 'Duplicate Student',
      email: 'other@university.edu',
      department: 'Computer Science',
      semester: 1,
    });
    assert.strictEqual(duplicateRes.isError, true);
    assert.ok(duplicateRes.content[0].text.includes('Conflict'));
    console.log('✔ create_student rejected duplicate studentId with 409 Conflict.');

    // 4. Test get_student
    console.log('\n[4/7] Testing get_student...');
    const getRes = await handleGetStudent({ studentId: testStudentId });
    assert.strictEqual(getRes.isError, undefined);
    assert.ok(getRes.content[0].text.includes('Ada Lovelace'));
    console.log('✔ get_student retrieved profile by student ID.');

    // 5. Test update_student
    console.log('\n[5/7] Testing update_student...');
    const updateRes = await handleUpdateStudent({
      studentId: testStudentId,
      semester: 5,
      department: 'Artificial Intelligence',
    });
    assert.strictEqual(updateRes.isError, undefined);
    assert.ok(updateRes.content[0].text.includes('Artificial Intelligence'));
    console.log('✔ update_student updated student record successfully.');

    // 6. Test list_students with filter
    console.log('\n[6/7] Testing list_students...');
    const listRes = await handleListStudents({ department: 'Artificial Intelligence' });
    assert.strictEqual(listRes.isError, undefined);
    assert.ok(listRes.content[0].text.includes(testStudentId));
    console.log('✔ list_students filtered and found updated student.');

    // 7. Test delete_student confirmation flow
    console.log('\n[7/7] Testing delete_student confirmation flow...');
    // Attempt deletion without confirmation flag
    const unconfirmedDel = await handleDeleteStudent({
      studentId: testStudentId,
      confirm: false,
    });
    assert.ok(unconfirmedDel.content[0].text.includes('CONFIRMATION_REQUIRED'));
    console.log('✔ delete_student unconfirmed call prompted for confirmation without deleting.');

    // Verify student is still in MongoDB
    const stillThere = await Student.findOne({ studentId: testStudentId });
    assert.ok(stillThere, 'Student must still exist after unconfirmed delete request');

    // Proceed with confirmed deletion
    const confirmedDel = await handleDeleteStudent({
      studentId: testStudentId,
      confirm: true,
      confirmStudentId: testStudentId,
    });
    assert.strictEqual(confirmedDel.isError, undefined);
    assert.ok(confirmedDel.content[0].text.includes('Deleted Successfully'));

    // Verify student is gone from MongoDB
    const gone = await Student.findOne({ studentId: testStudentId });
    assert.strictEqual(gone, null, 'Student must be removed from MongoDB Atlas');
    console.log('✔ delete_student confirmed deletion verified in MongoDB Atlas.');

    console.log('\n======================================================');
    console.log('🎉 ALL 7 MCP TOOL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    // Final cleanup and disconnect
    await Student.deleteMany({ studentId: testStudentId });
    await disconnectDatabase();
  }
}

runMcpVerification().catch((err) => {
  console.error('❌ MCP Verification Failed:', err);
  process.exit(1);
});
