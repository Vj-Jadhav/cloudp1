import { ensureDatabaseConnected } from '../db/connection.js';
import { Student } from '../db/models/Student.js';
import { logger } from '../utils/logger.js';

interface ListStudentsArgs {
  department?: string;
  semester?: number;
  search?: string;
  limit?: number;
  page?: number;
}

export async function handleListStudents(args: ListStudentsArgs) {
  try {
    await ensureDatabaseConnected();

    const query: Record<string, unknown> = {};

    if (args.department && args.department.trim() !== '') {
      query.department = { $regex: new RegExp(`^${args.department.trim()}$`, 'i') };
    }

    if (args.semester !== undefined) {
      query.semester = args.semester;
    }

    if (args.search && args.search.trim() !== '') {
      const searchRegex = new RegExp(args.search.trim(), 'i');
      query.$or = [
        { studentId: searchRegex },
        { name: searchRegex },
        { department: searchRegex },
        { email: searchRegex },
      ];
    }

    const pageNum = Math.max(1, args.page || 1);
    const limitNum = Math.min(100, Math.max(1, args.limit || 20));
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      Student.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Student.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    logger.info(`list_students: returned ${students.length} of ${total} records`);

    const result = {
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
      filtersApplied: {
        department: args.department || null,
        semester: args.semester ?? null,
        search: args.search || null,
      },
      students: students.map((s) => ({
        id: String(s._id),
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        department: s.department,
        semester: s.semester,
        contact: s.contact || '',
        createdAt: s.createdAt,
      })),
    };

    let summaryText = `### Student Records (${students.length} of ${total})\n`;
    if (students.length === 0) {
      summaryText += 'No students match the provided criteria.\n';
    } else {
      summaryText += `| Student ID | Name | Department | Semester | Email | Contact |\n`;
      summaryText += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      for (const s of result.students) {
        summaryText += `| **${s.studentId}** | ${s.name} | ${s.department} | Sem ${s.semester} | ${s.email} | ${s.contact || 'N/A'} |\n`;
      }
      summaryText += `\n*Page ${pageNum} of ${totalPages} (Total records: ${total})*\n`;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${summaryText}\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error in handleListStudents:', message);
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: false,
              error: 'DatabaseError',
              message: `Failed to retrieve students: ${message}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
