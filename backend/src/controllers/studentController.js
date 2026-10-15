import Student from '../models/Student.js';

/**
 * Helper to extract duplicate key conflict details from MongoError (code 11000)
 */
const handleDuplicateKeyError = (error, res) => {
  if (error.code === 11000) {
    const key = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
    const value = error.keyValue ? error.keyValue[key] : 'provided value';
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: `A student with ${key} "${value}" already exists.`,
      field: key,
      value,
    });
  }
  return null;
};

/**
 * @desc   Get all students with filtering, search, pagination, and sorting
 * @route  GET /api/students
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const {
      search,
      department,
      semester,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by department
    if (department && department.trim() !== '') {
      query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    }

    // Filter by semester
    if (semester !== undefined && semester !== '') {
      const semNum = Number(semester);
      if (!isNaN(semNum)) {
        query.semester = semNum;
      }
    }

    // Global search across studentId, name, department, email
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { studentId: searchRegex },
        { name: searchRegex },
        { department: searchRegex },
        { email: searchRegex },
      ];
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'studentId', 'semester', 'department'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;

    const [students, total] = await Promise.all([
      Student.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Student.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: students.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: students,
    });
  } catch (error) {
    console.error('[Student Controller] Error in getAllStudents:', error);
    next(error);
  }
};

/**
 * @desc   Get a single student by MongoDB _id
 * @route  GET /api/students/:id
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Student not found with ID "${req.params.id}".`,
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('[Student Controller] Error in getStudentById:', error);
    next(error);
  }
};

/**
 * @desc   Create a new student record
 * @route  POST /api/students
 */
export const createStudent = async (req, res, next) => {
  try {
    const { studentId, name, email, department, semester, contact } = req.body;

    // Check for existing duplicate studentId or email beforehand for clear reporting
    const existingStudent = await Student.findOne({
      $or: [{ studentId: studentId.toUpperCase() }, { email: email.toLowerCase() }],
    });

    if (existingStudent) {
      const field = existingStudent.studentId === studentId.toUpperCase() ? 'studentId' : 'email';
      const value = field === 'studentId' ? studentId : email;
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `A student with ${field} "${value}" already exists.`,
        field,
        value,
      });
    }

    const student = new Student({
      studentId,
      name,
      email,
      department,
      semester,
      contact: contact || '',
    });

    const savedStudent = await student.save();

    return res.status(201).json({
      success: true,
      message: 'Student record created successfully.',
      data: savedStudent,
    });
  } catch (error) {
    const duplicateHandled = handleDuplicateKeyError(error, res);
    if (duplicateHandled) return;

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Student validation failed.',
        errors,
      });
    }

    console.error('[Student Controller] Error in createStudent:', error);
    next(error);
  }
};

/**
 * @desc   Update an existing student record by _id
 * @route  PUT /api/students/:id
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if student exists
    const currentStudent = await Student.findById(id);
    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Student not found with ID "${id}".`,
      });
    }

    // Check for conflicting duplicate studentId or email with other students
    if (updates.studentId || updates.email) {
      const conflictQuery = {
        _id: { $ne: id },
        $or: [],
      };
      if (updates.studentId) conflictQuery.$or.push({ studentId: updates.studentId });
      if (updates.email) conflictQuery.$or.push({ email: updates.email });

      if (conflictQuery.$or.length > 0) {
        const conflict = await Student.findOne(conflictQuery);
        if (conflict) {
          const field = conflict.studentId === updates.studentId ? 'studentId' : 'email';
          const value = updates[field];
          return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: `Another student with ${field} "${value}" already exists.`,
            field,
            value,
          });
        }
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
      data: updatedStudent,
    });
  } catch (error) {
    const duplicateHandled = handleDuplicateKeyError(error, res);
    if (duplicateHandled) return;

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Student validation failed during update.',
        errors,
      });
    }

    console.error('[Student Controller] Error in updateStudent:', error);
    next(error);
  }
};

/**
 * @desc   Delete a student record by _id
 * @route  DELETE /api/students/:id
 */
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Student not found with ID "${id}".`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student record with ID "${deletedStudent.studentId}" deleted successfully.`,
      data: {
        id: deletedStudent._id,
        studentId: deletedStudent.studentId,
        name: deletedStudent.name,
      },
    });
  } catch (error) {
    console.error('[Student Controller] Error in deleteStudent:', error);
    next(error);
  }
};
