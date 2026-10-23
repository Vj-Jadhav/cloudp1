import { ensureDatabaseConnected } from '../db/connection.js';
import { Student } from '../db/models/Student.js';
import { logger } from '../utils/logger.js';

interface CreateStudentArgs {
  studentId: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  contact?: string;
}

export async function handleCreateStudent(args: CreateStudentArgs) {
  try {
    await ensureDatabaseConnected();

    const normalizedStudentId = args.studentId.trim().toUpperCase();
    const normalizedEmail = args.email.trim().toLowerCase();
    const normalizedName = args.name.trim();
    const normalizedDepartment = args.department.trim();
    const normalizedContact = args.contact ? args.contact.trim() : '';

    // Check for existing duplicate studentId or email in MongoDB Atlas
    const existing = await Student.findOne({
      $or: [{ studentId: normalizedStudentId }, { email: normalizedEmail }],
    }).lean();

    if (existing) {
      const field = existing.studentId === normalizedStudentId ? 'studentId' : 'email';
      const value = field === 'studentId' ? normalizedStudentId : normalizedEmail;
      logger.warn(`create_student rejected: duplicate ${field} "${value}"`);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'Conflict',
                message: `Cannot create student: A student with ${field} "${value}" already exists in MongoDB Atlas.`,
                field,
                conflictingValue: value,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const newStudent = new Student({
      studentId: normalizedStudentId,
      name: normalizedName,
      email: normalizedEmail,
      department: normalizedDepartment,
      semester: args.semester,
      contact: normalizedContact,
    });

    const savedStudent = await newStudent.save();

    // Verify MongoDB confirmed insertion
    if (!savedStudent || !savedStudent._id) {
      throw new Error('MongoDB Atlas failed to return a valid document ID after save.');
    }

    logger.info(`create_student: successfully created ${savedStudent.studentId} (${savedStudent.name})`);

    const result = {
      success: true,
      message: `Student "${savedStudent.name}" (${savedStudent.studentId}) successfully registered in MongoDB Atlas.`,
      student: {
        id: String(savedStudent._id),
        studentId: savedStudent.studentId,
        name: savedStudent.name,
        email: savedStudent.email,
        department: savedStudent.department,
        semester: savedStudent.semester,
        contact: savedStudent.contact || 'N/A',
        createdAt: savedStudent.createdAt,
      },
    };

    const displayText = [
      `✅ **Student Record Created Successfully in MongoDB Atlas**`,
      `- **Student ID:** ${savedStudent.studentId}`,
      `- **Full Name:** ${savedStudent.name}`,
      `- **Email:** ${savedStudent.email}`,
      `- **Department:** ${savedStudent.department}`,
      `- **Semester:** ${savedStudent.semester}`,
      `- **Contact:** ${savedStudent.contact || 'Not provided'}`,
      `- **Database ID:** \`${savedStudent._id}\``,
    ].join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `${displayText}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        },
      ],
    };
  } catch (error: any) {
    logger.error('Error in handleCreateStudent:', error);

    // Handle MongoDB unique index violation code 11000
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
      const val = error.keyValue ? error.keyValue[field] : 'duplicate';
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'DuplicateKeyError',
                message: `Database constraint violation: A student with ${field} "${val}" already exists.`,
                field,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: false,
              error: 'DatabaseError',
              message: `Failed to create student in MongoDB Atlas: ${message}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
