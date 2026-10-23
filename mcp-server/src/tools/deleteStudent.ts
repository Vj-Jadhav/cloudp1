import mongoose from 'mongoose';
import { ensureDatabaseConnected } from '../db/connection.js';
import { Student } from '../db/models/Student.js';
import { logger } from '../utils/logger.js';

interface DeleteStudentArgs {
  studentId: string;
  confirm?: boolean;
  confirmStudentId?: string;
}

export async function handleDeleteStudent(args: DeleteStudentArgs) {
  try {
    await ensureDatabaseConnected();

    const rawId = args.studentId.trim();
    const query: Record<string, unknown> = {
      $or: [{ studentId: rawId.toUpperCase() }],
    };

    if (mongoose.Types.ObjectId.isValid(rawId) && rawId.length === 24) {
      (query.$or as unknown[]).push({ _id: new mongoose.Types.ObjectId(rawId) });
    }

    const student = await Student.findOne(query);

    if (!student) {
      logger.warn(`delete_student: student not found with ID "${rawId}"`);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: 'NotFound',
                message: `Cannot delete: Student not found with identifier "${rawId}".`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const isConfirmed =
      args.confirm === true &&
      args.confirmStudentId &&
      args.confirmStudentId.trim().toUpperCase() === student.studentId.toUpperCase();

    // Safety Gate: If not explicitly confirmed with matching student ID, prompt user
    if (!isConfirmed) {
      logger.warn(
        `delete_student: deletion confirmation required for ${student.studentId} (${student.name})`
      );

      const challengeResponse = {
        success: false,
        status: 'CONFIRMATION_REQUIRED',
        warning: '⚠️ DESTRUCTIVE ACTION: Student deletion is permanent and cannot be undone.',
        message: `To permanently delete student "${student.name}" (ID: ${student.studentId}), you must re-invoke this tool with explicit confirmation matching the student ID.`,
        targetStudent: {
          id: String(student._id),
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          department: student.department,
          semester: student.semester,
        },
        requiredConfirmation: {
          studentId: student.studentId,
          confirm: true,
          confirmStudentId: student.studentId,
        },
      };

      const promptText = [
        `⚠️ **Deletion Confirmation Required**`,
        ``,
        `You are requesting to permanently delete the following student from MongoDB Atlas:`,
        `- **Student ID:** \`${student.studentId}\``,
        `- **Name:** ${student.name}`,
        `- **Department:** ${student.department}`,
        `- **Semester:** ${student.semester}`,
        `- **Email:** ${student.email}`,
        ``,
        `**This operation is IRREVERSIBLE.**`,
        `To confirm and proceed, call \`delete_student\` with:`,
        `\`\`\`json`,
        JSON.stringify(
          {
            studentId: student.studentId,
            confirm: true,
            confirmStudentId: student.studentId,
          },
          null,
          2
        ),
        `\`\`\``,
      ].join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `${promptText}\n\n\`\`\`json\n${JSON.stringify(challengeResponse, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    // Explicit confirmation verified. Proceed with targeted single delete.
    const deleteResult = await Student.deleteOne({ _id: student._id });

    if (!deleteResult || deleteResult.deletedCount !== 1) {
      throw new Error(
        `MongoDB Atlas deletion failed: deletedCount was ${deleteResult?.deletedCount || 0}, expected 1.`
      );
    }

    logger.info(`delete_student: successfully deleted student ${student.studentId} (${student.name})`);

    const result = {
      success: true,
      message: `Student record "${student.name}" (${student.studentId}) was permanently deleted from MongoDB Atlas.`,
      mongoDbConfirmed: true,
      deletedCount: deleteResult.deletedCount,
      deletedStudent: {
        id: String(student._id),
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
      },
    };

    const successText = [
      `🗑️ **Student Record Deleted Successfully from MongoDB Atlas**`,
      `- **Deleted Student ID:** \`${student.studentId}\``,
      `- **Name:** ${student.name}`,
      `- **Department:** ${student.department}`,
      `- **MongoDB Atlas Confirmation:** Verified (deletedCount: 1)`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `${successText}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error in handleDeleteStudent:', message);
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: false,
              error: 'DatabaseError',
              message: `Failed to delete student: ${message}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
