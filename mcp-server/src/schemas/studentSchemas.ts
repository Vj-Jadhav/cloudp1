import { z } from 'zod';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const STUDENT_ID_REGEX = /^[A-Za-z0-9-_]+$/;
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

/**
 * Zod validation schemas for all MCP server tools.
 * Ensures strict typing and prevents arbitrary queries or malformed data.
 */

export const listStudentsSchema = {
  department: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .describe('Filter students by department (e.g., "Computer Science", "Information Technology")'),
  semester: z
    .number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be between 1 and 12')
    .max(12, 'Semester must be between 1 and 12')
    .optional()
    .describe('Filter students by semester (1-12)'),
  search: z
    .string()
    .trim()
    .optional()
    .describe('Search query across student ID, name, email, and department'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .optional()
    .describe('Number of students to return (1-100, default: 20)'),
  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .optional()
    .describe('Page number for pagination (default: 1)'),
};

export const getStudentSchema = {
  studentId: z
    .string()
    .trim()
    .min(1, 'Student ID is required')
    .describe('The unique Student ID (e.g. "CS-101", "STU-001") or 24-character MongoDB ObjectId'),
};

export const createStudentSchema = {
  studentId: z
    .string()
    .trim()
    .min(1, 'Student ID cannot be empty')
    .regex(
      STUDENT_ID_REGEX,
      'Student ID must be alphanumeric and may contain hyphens or underscores (e.g. "CS-101", "STU_2024")'
    )
    .describe('Unique student identifier (alphanumeric, hyphens, underscores)'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .describe('Full name of the student'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_REGEX, 'Invalid email format (e.g. student@university.edu)')
    .describe('Unique student email address'),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be at least 2 characters long')
    .max(50, 'Department cannot exceed 50 characters')
    .describe('Department or academic major (e.g. "Computer Science")'),
  semester: z
    .number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12')
    .describe('Current semester number (1-12)'),
  contact: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || PHONE_REGEX.test(val),
      'Contact must be a valid phone number format with 7-15 digits'
    )
    .describe('Optional contact phone number (7-15 digits)'),
};

export const updateStudentSchema = {
  studentId: z
    .string()
    .trim()
    .min(1, 'Target studentId is required to find the student to update')
    .describe('The Student ID of the student you want to update'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .optional()
    .describe('Updated student name'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_REGEX, 'Invalid email format')
    .optional()
    .describe('Updated student email address'),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be at least 2 characters long')
    .max(50, 'Department cannot exceed 50 characters')
    .optional()
    .describe('Updated department name'),
  semester: z
    .number()
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12')
    .optional()
    .describe('Updated semester (1-12)'),
  contact: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || PHONE_REGEX.test(val),
      'Contact must be a valid phone number with 7-15 digits'
    )
    .describe('Updated contact phone number'),
  newStudentId: z
    .string()
    .trim()
    .regex(
      STUDENT_ID_REGEX,
      'New Student ID must be alphanumeric and may contain hyphens or underscores'
    )
    .optional()
    .describe('New Student ID (if changing the student ID itself)'),
};

export const deleteStudentSchema = {
  studentId: z
    .string()
    .trim()
    .min(1, 'Student ID is required')
    .describe('The Student ID of the student to delete'),
  confirm: z
    .boolean()
    .default(false)
    .optional()
    .describe(
      'Explicit confirmation flag. Must be set to true to execute deletion after reviewing student details.'
    ),
  confirmStudentId: z
    .string()
    .trim()
    .optional()
    .describe(
      'Confirmation token matching the studentId exactly. Required when confirm is true to prevent accidental deletion.'
    ),
};

export const getStudentStatisticsSchema = {
  department: z
    .string()
    .trim()
    .optional()
    .describe('Optional department name to filter statistics for a single department'),
};
