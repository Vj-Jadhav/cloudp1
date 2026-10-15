import React from 'react';
import { Users, Building2, BookOpen, Database } from 'lucide-react';

export const SummaryCards = ({ students = [], totalCount = 0, healthInfo = null }) => {
  // Compute metrics
  const uniqueDepartments = new Set(students.map((s) => s.department).filter(Boolean));
  const deptCount = uniqueDepartments.size;

  const validSemesters = students.map((s) => s.semester).filter((sem) => typeof sem === 'number');
  const avgSemester =
    validSemesters.length > 0
      ? (validSemesters.reduce((acc, curr) => acc + curr, 0) / validSemesters.length).toFixed(1)
      : 'N/A';

  const dbHost = healthInfo?.database?.host || 'MongoDB Atlas';
  const isDbConnected = healthInfo?.database?.status === 'connected';

  return (
    <section className="summary-grid" aria-label="Student management overview statistics">
      {/* Total Students Card */}
      <div className="summary-card">
        <div className="summary-icon-box purple" aria-hidden="true">
          <Users size={24} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Total Students</span>
          <span className="summary-value">{totalCount}</span>
          <span className="summary-desc">Active registrations</span>
        </div>
      </div>

      {/* Departments Card */}
      <div className="summary-card">
        <div className="summary-icon-box cyan" aria-hidden="true">
          <Building2 size={24} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Departments</span>
          <span className="summary-value">{deptCount}</span>
          <span className="summary-desc">Academic programs</span>
        </div>
      </div>

      {/* Average Semester Card */}
      <div className="summary-card">
        <div className="summary-icon-box emerald" aria-hidden="true">
          <BookOpen size={24} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Average Semester</span>
          <span className="summary-value">{avgSemester}</span>
          <span className="summary-desc">Enrolled student average</span>
        </div>
      </div>

      {/* Cloud Data Tier Card */}
      <div className="summary-card">
        <div className="summary-icon-box amber" aria-hidden="true">
          <Database size={24} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Database Tier</span>
          <span className="summary-value" style={{ fontSize: '1.25rem' }}>
            {isDbConnected ? 'Atlas Cloud' : 'Connecting'}
          </span>
          <span className="summary-desc" title={dbHost}>
            {isDbConnected ? 'Replica set healthy' : 'Checking status...'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default SummaryCards;
