import mongoose from 'mongoose';
import { ensureDatabaseConnected } from '../db/connection.js';
import { Student } from '../db/models/Student.js';
import { logger } from '../utils/logger.js';

interface UpdateStudentArgs {
  studentId: string;
  name?: string;
  email?: string;
  department?: string;
  semester?: number;
  contact?: string;
  newStudentId?: string;
}

export async function handleUpdateStudent(args: UpdateStudentArgs) {
  try {
    await ensureDatabaseConnected();

    const rawId = args.studentId.trim();
    const query: Record<string, unknown> = {
      $or: [{ studentId: rawId.toUpperCase() }],
    };

    if (mongoose.Types.ObjectId.isValid(rawId) && rawId.length === 24) {
      (query.$or as unknown[]).push({ _id: new mongoose.Types.ObjectId(rawId) });
    }

    const currentStudent = await Student.findOne(query);

    if (!currentStudent) {
      logger.warn(`update_student: student not found for identifier "${rawId}"`);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'NotFound',
                message: `Cannot update: No student found with ID "${rawId}".`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const updates: Record<string, unknown> = {};

    if (args.name !== undefined) {
      updates.name = args.name.trim();
    }

    if (args.department !== undefined) {
      updates.department = args.department.trim();
    }

    if (args.semester !== undefined) {
      updates.semester = args.semester;
    }

    if (args.contact !== undefined) {
      updates.contact = args.contact.trim();
    }

    if (args.email !== undefined) {
      updates.email = args.email.trim().toLowerCase();
    }

    if (args.newStudentId !== undefined) {
      updates.studentId = args.newStudentId.trim().toUpperCase();
    }

    if (Object.keys(updates).length === 0) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'ValidationError',
                message: 'No update fields were provided. Specify at least one field to update (e.g., name, email, department, semester, contact, or newStudentId).',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Check for conflicting duplicate studentId or email with other students
    if (updates.studentId || updates.email) {
      const conflictQuery: Record<string, unknown> = {
        _id: { $ne: currentStudent._id },
        $or: [],
      };

      if (updates.studentId) {
        (conflictQuery.$or as unknown[]).push({ studentId: updates.studentId });
      }
      if (updates.email) {
        (conflictQuery.$or as unknown[]).push({ email: updates.email });
      }

      if ((conflictQuery.$or as unknown[]).length > 0) {
        const conflict = await Student.findOne(conflictQuery).lean();
        if (conflict) {
          const field = conflict.studentId === updates.studentId ? 'studentId' : 'email';
          const value = updates[field];
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    success: false,
                    error: 'Conflict',
                    message: `Cannot update student: Another student already exists with ${field} "${value}".`,
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
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      currentStudent._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedStudent) {
      throw new Error('MongoDB Atlas did not return the updated record.');
    }

    logger.info(`update_student: updated student ${updatedStudent.studentId}`);

    const result = {
      success: true,
      message: `Student record "${updatedStudent.studentId}" successfully updated in MongoDB Atlas.`,
      updatedFields: Object.keys(updates),
      student: {
        id: String(updatedStudent._id),
        studentId: updatedStudent.studentId,
        name: updatedStudent.name,
        email: updatedStudent.email,
        department: updatedStudent.department,
        semester: updatedStudent.semester,
        contact: updatedStudent.contact || 'N/A',
        updatedAt: updatedStudent.updatedAt,
      },
    };

    const displayText = [
      `✅ **Student Record Updated in MongoDB Atlas**`,
      `- **Target Student:** ${updatedStudent.name} (\`${updatedStudent.studentId}\`)`,
      `- **Fields Updated:** ${Object.keys(updates).join(', ')}`,
      `- **New Values:**`,
      ...Object.entries(updates).map(([k, v]) => `  - **${k}:** ${v}`),
      `- **Timestamp:** ${new Date(updatedStudent.updatedAt).toLocaleString()}`,
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
    logger.error('Error in handleUpdateStudent:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'DuplicateKeyError',
                message: `Update would violate uniqueness on field "${field}".`,
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
              message: `Failed to update student: ${message}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
