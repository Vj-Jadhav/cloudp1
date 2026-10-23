import { ensureDatabaseConnected } from '../db/connection.js';
import { Student } from '../db/models/Student.js';
import { logger } from '../utils/logger.js';

interface StudentStatsArgs {
  department?: string;
}

export async function handleStudentStatistics(args: StudentStatsArgs) {
  try {
    await ensureDatabaseConnected();

    // Overall total students
    const totalStudents = await Student.countDocuments();

    // Department breakdown
    const departmentStats = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgSemester: { $avg: '$semester' },
          minSemester: { $min: '$semester' },
          maxSemester: { $max: '$semester' },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]);

    // Semester breakdown
    const semesterStats = await Student.aggregate([
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // If a specific department is requested, gather focused statistics
    let departmentSpecific: Record<string, unknown> | null = null;
    if (args.department && args.department.trim() !== '') {
      const deptName = args.department.trim();
      const deptRegex = new RegExp(`^${deptName}$`, 'i');
      const deptTotal = await Student.countDocuments({ department: deptRegex });
      const deptSemesters = await Student.aggregate([
        { $match: { department: deptRegex } },
        {
          $group: {
            _id: '$semester',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      departmentSpecific = {
        searchedDepartment: deptName,
        totalInDepartment: deptTotal,
        percentageOfTotal: totalStudents > 0 ? Number(((deptTotal / totalStudents) * 100).toFixed(1)) : 0,
        semesterDistribution: deptSemesters.map((s) => ({
          semester: s._id,
          count: s.count,
        })),
      };
    }

    logger.info(`get_student_statistics: compiled stats for ${totalStudents} total students`);

    const result = {
      success: true,
      summary: {
        totalStudents,
        totalDepartments: departmentStats.length,
        departmentDistribution: departmentStats.map((d) => ({
          department: d._id || 'Unassigned',
          count: d.count,
          percentage: totalStudents > 0 ? Number(((d.count / totalStudents) * 100).toFixed(1)) : 0,
          averageSemester: Number(d.avgSemester.toFixed(1)),
          semesterRange: `${d.minSemester} - ${d.maxSemester}`,
        })),
        semesterDistribution: semesterStats.map((s) => ({
          semester: `Semester ${s._id}`,
          count: s.count,
          percentage: totalStudents > 0 ? Number(((s.count / totalStudents) * 100).toFixed(1)) : 0,
        })),
      },
      departmentSpecific,
    };

    let summaryText = `### Student Management System Statistics\n`;
    summaryText += `- **Total Enrolled Students:** ${totalStudents}\n`;
    summaryText += `- **Active Academic Departments:** ${departmentStats.length}\n\n`;

    summaryText += `#### Department Breakdown\n`;
    summaryText += `| Department | Count | % of Total | Avg Semester | Sem Range |\n`;
    summaryText += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const d of result.summary.departmentDistribution) {
      summaryText += `| **${d.department}** | ${d.count} | ${d.percentage}% | ${d.averageSemester} | ${d.semesterRange} |\n`;
    }

    summaryText += `\n#### Semester Distribution\n`;
    summaryText += `| Semester | Student Count | % of Total |\n`;
    summaryText += `| :--- | :--- | :--- |\n`;
    for (const s of result.summary.semesterDistribution) {
      summaryText += `| ${s.semester} | ${s.count} | ${s.percentage}% |\n`;
    }

    if (departmentSpecific) {
      summaryText += `\n#### Filtered Department: ${departmentSpecific.searchedDepartment}\n`;
      summaryText += `- Total Students in Department: **${departmentSpecific.totalInDepartment}** (${departmentSpecific.percentageOfTotal}% of all students)\n`;
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
    logger.error('Error in handleStudentStatistics:', message);
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: false,
              error: 'DatabaseError',
              message: `Failed to compile student statistics: ${message}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
