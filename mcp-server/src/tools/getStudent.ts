import mongoose from 'mongoose';
import { ensureDatabaseConnected } from '../db/connection.js';
import { Student } from '../db/models/Student.js';
import { logger } from '../utils/logger.js';

interface GetStudentArgs {
  studentId: string;
}

export async function handleGetStudent(args: GetStudentArgs) {
  try {
    await ensureDatabaseConnected();

    const rawId = args.studentId.trim();
    const query: Record<string, unknown> = {
      $or: [{ studentId: rawId.toUpperCase() }],
    };

    // If it is a valid MongoDB ObjectId, also check by _id
    if (mongoose.Types.ObjectId.isValid(rawId) && rawId.length === 24) {
      (query.$or as unknown[]).push({ _id: new mongoose.Types.ObjectId(rawId) });
    }

    const student = await Student.findOne(query).lean();

    if (!student) {
      logger.warn(`get_student: student not found for ID "${rawId}"`);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'NotFound',
                message: `No student found with ID "${rawId}".`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    logger.info(`get_student: retrieved student ${student.studentId} (${student.name})`);

    const result = {
      success: true,
      student: {
        id: String(student._id),
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        semester: student.semester,
        contact: student.contact || 'N/A',
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    };

    const detailsText = [
      `### Student Profile: ${student.name} (${student.studentId})`,
      `- **Student ID:** ${student.studentId}`,
      `- **Full Name:** ${student.name}`,
      `- **Email Address:** ${student.email}`,
      `- **Department:** ${student.department}`,
      `- **Current Semester:** ${student.semester}`,
      `- **Contact Number:** ${student.contact || 'Not provided'}`,
      `- **Record Created:** ${new Date(student.createdAt).toLocaleString()}`,
      `- **Last Updated:** ${new Date(student.updatedAt).toLocaleString()}`,
      `- **MongoDB Atlas ID:** \`${student._id}\``,
    ].join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `${detailsText}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error in handleGetStudent:', message);
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: false,
              error: 'DatabaseError',
              message: `Failed to retrieve student: ${message}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
