/**
 * Regular expressions for validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const STUDENT_ID_REGEX = /^[A-Za-z0-9-_]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

/**
 * Validates request body for POST /api/students
 */
export const validateCreateStudent = (req, res, next) => {
  const { studentId, name, email, department, semester, contact } = req.body;
  const errors = [];

  // studentId
  if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
    errors.push('studentId is required and must be a non-empty string.');
  } else if (!STUDENT_ID_REGEX.test(studentId.trim())) {
    errors.push('studentId must be alphanumeric and may only contain letters, numbers, hyphens, and underscores.');
  }

  // name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string.');
  } else if (name.trim().length < 2) {
    errors.push('name must be at least 2 characters long.');
  } else if (name.trim().length > 100) {
    errors.push('name cannot exceed 100 characters.');
  }

  // email
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('email must be a valid email address (e.g. user@example.com).');
  }

  // department
  if (!department || typeof department !== 'string' || department.trim() === '') {
    errors.push('department is required.');
  } else if (department.trim().length < 2) {
    errors.push('department must be at least 2 characters long.');
  }

  // semester
  if (semester === undefined || semester === null || semester === '') {
    errors.push('semester is required.');
  } else {
    const semNum = Number(semester);
    if (!Number.isInteger(semNum) || semNum < 1 || semNum > 12) {
      errors.push('semester must be an integer between 1 and 12.');
    }
  }

  // contact (optional)
  if (contact !== undefined && contact !== null && String(contact).trim() !== '') {
    if (!PHONE_REGEX.test(String(contact).trim())) {
      errors.push('contact must be a valid phone number format with 7 to 15 digits.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Request body validation failed.',
      errors,
    });
  }

  // Normalize inputs
  req.body.studentId = studentId.trim().toUpperCase();
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.department = department.trim();
  req.body.semester = Number(semester);
  if (contact) req.body.contact = String(contact).trim();

  next();
};

/**
 * Validates request body for PUT /api/students/:id
 */
export const validateUpdateStudent = (req, res, next) => {
  const { studentId, name, email, department, semester, contact } = req.body;
  const errors = [];

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Request body cannot be empty for student update.',
      errors: ['At least one field must be provided for update.'],
    });
  }

  // studentId (if updating)
  if (studentId !== undefined) {
    if (typeof studentId !== 'string' || studentId.trim() === '') {
      errors.push('studentId must be a non-empty string.');
    } else if (!STUDENT_ID_REGEX.test(studentId.trim())) {
      errors.push('studentId must be alphanumeric and may only contain letters, numbers, hyphens, and underscores.');
    } else {
      req.body.studentId = studentId.trim().toUpperCase();
    }
  }

  // name (if updating)
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      errors.push('name must be a non-empty string.');
    } else if (name.trim().length < 2) {
      errors.push('name must be at least 2 characters long.');
    } else if (name.trim().length > 100) {
      errors.push('name cannot exceed 100 characters.');
    } else {
      req.body.name = name.trim();
    }
  }

  // email (if updating)
  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim() === '') {
      errors.push('email cannot be empty.');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.push('email must be a valid email address.');
    } else {
      req.body.email = email.trim().toLowerCase();
    }
  }

  // department (if updating)
  if (department !== undefined) {
    if (typeof department !== 'string' || department.trim() === '') {
      errors.push('department cannot be empty.');
    } else if (department.trim().length < 2) {
      errors.push('department must be at least 2 characters long.');
    } else {
      req.body.department = department.trim();
    }
  }

  // semester (if updating)
  if (semester !== undefined) {
    const semNum = Number(semester);
    if (!Number.isInteger(semNum) || semNum < 1 || semNum > 12) {
      errors.push('semester must be an integer between 1 and 12.');
    } else {
      req.body.semester = semNum;
    }
  }

  // contact (if updating)
  if (contact !== undefined && contact !== null && String(contact).trim() !== '') {
    if (!PHONE_REGEX.test(String(contact).trim())) {
      errors.push('contact must be a valid phone number format with 7 to 15 digits.');
    } else {
      req.body.contact = String(contact).trim();
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Request body validation failed for update.',
      errors,
    });
  }

  next();
};
