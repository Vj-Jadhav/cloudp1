import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import {
  validateCreateStudent,
  validateUpdateStudent,
} from '../middleware/validateStudent.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

// Routes for /api/students
router
  .route('/')
  .get(getAllStudents)
  .post(validateCreateStudent, createStudent);

// Routes for /api/students/:id
router
  .route('/:id')
  .get(validateObjectId('id'), getStudentById)
  .put(validateObjectId('id'), validateUpdateStudent, updateStudent)
  .delete(validateObjectId('id'), deleteStudent);

export default router;
