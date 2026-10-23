import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  listStudentsSchema,
  getStudentSchema,
  createStudentSchema,
  updateStudentSchema,
  deleteStudentSchema,
  getStudentStatisticsSchema,
} from '../schemas/studentSchemas.js';
import { handleListStudents } from './listStudents.js';
import { handleGetStudent } from './getStudent.js';
import { handleCreateStudent } from './createStudent.js';
import { handleUpdateStudent } from './updateStudent.js';
import { handleDeleteStudent } from './deleteStudent.js';
import { handleStudentStatistics } from './studentStats.js';
import { logger } from '../utils/logger.js';

/**
 * Registers all 6 verified MCP tools onto the McpServer instance.
 */
export function registerStudentTools(server: McpServer): void {
  // Tool 1: list_students
  server.tool(
    'list_students',
    'List students from MongoDB Atlas with optional department, semester, search, and pagination filters.',
    listStudentsSchema,
    async (args) => {
      logger.info('Invoked tool: list_students', args);
      return await handleListStudents(args);
    }
  );

  // Tool 2: get_student
  server.tool(
    'get_student',
    'Retrieve complete profile for a specific student by their unique student ID (or MongoDB ObjectId).',
    getStudentSchema,
    async (args) => {
      logger.info(`Invoked tool: get_student with studentId="${args.studentId}"`);
      return await handleGetStudent(args);
    }
  );

  // Tool 3: create_student
  server.tool(
    'create_student',
    'Add a new validated student record to the MongoDB Atlas database. Validates all fields and prevents duplicates.',
    createStudentSchema,
    async (args) => {
      logger.info(`Invoked tool: create_student for studentId="${args.studentId}"`);
      return await handleCreateStudent(args);
    }
  );

  // Tool 4: update_student
  server.tool(
    'update_student',
    'Update explicitly allowed fields (name, email, department, semester, contact, studentId) of an existing student in MongoDB Atlas.',
    updateStudentSchema,
    async (args) => {
      logger.info(`Invoked tool: update_student for studentId="${args.studentId}"`);
      return await handleUpdateStudent(args);
    }
  );

  // Tool 5: delete_student
  server.tool(
    'delete_student',
    'Delete a specific student from MongoDB Atlas. Requires explicit confirmation (confirm: true and confirmStudentId) before deleting to prevent accidental loss.',
    deleteStudentSchema,
    async (args) => {
      logger.info(`Invoked tool: delete_student for studentId="${args.studentId}", confirm=${args.confirm}`);
      return await handleDeleteStudent(args);
    }
  );

  // Tool 6: get_student_statistics
  server.tool(
    'get_student_statistics',
    'Return accurate student counts, department distribution, and semester statistics from MongoDB Atlas.',
    getStudentStatisticsSchema,
    async (args) => {
      logger.info('Invoked tool: get_student_statistics', args);
      return await handleStudentStatistics(args);
    }
  );

  logger.info('All 6 Student Management MCP tools registered successfully.');
}
