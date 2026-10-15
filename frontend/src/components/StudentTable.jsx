import React from 'react';
import {
  Edit2,
  Trash2,
  Phone,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserX,
  Plus,
} from 'lucide-react';

export const StudentTable = ({
  students = [],
  loading = false,
  pagination = {},
  onPageChange,
  onEditStudent,
  onDeleteStudent,
  onAddNew,
  sortBy,
  order,
  onSortChange,
}) => {
  // Generate initials for avatar
  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

  // Format date nicely
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // Render sort icon on header
  const renderSortIndicator = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={14} className="sort-icon-inactive" style={{ opacity: 0.35 }} />;
    }
    return order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const handleHeaderClick = (field) => {
    if (onSortChange) {
      onSortChange(field);
    }
  };

  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="student-table" aria-label="Student records list">
          <thead>
            <tr>
              <th
                scope="col"
                className="sortable"
                onClick={() => handleHeaderClick('studentId')}
                aria-sort={sortBy === 'studentId' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="sort-header-content">
                  <span>Student ID</span>
                  {renderSortIndicator('studentId')}
                </div>
              </th>
              <th
                scope="col"
                className="sortable"
                onClick={() => handleHeaderClick('name')}
                aria-sort={sortBy === 'name' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="sort-header-content">
                  <span>Student Details</span>
                  {renderSortIndicator('name')}
                </div>
              </th>
              <th
                scope="col"
                className="sortable"
                onClick={() => handleHeaderClick('department')}
                aria-sort={sortBy === 'department' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="sort-header-content">
                  <span>Department</span>
                  {renderSortIndicator('department')}
                </div>
              </th>
              <th
                scope="col"
                className="sortable"
                onClick={() => handleHeaderClick('semester')}
                aria-sort={sortBy === 'semester' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="sort-header-content">
                  <span>Semester</span>
                  {renderSortIndicator('semester')}
                </div>
              </th>
              <th scope="col">Contact</th>
              <th
                scope="col"
                className="sortable"
                onClick={() => handleHeaderClick('createdAt')}
                aria-sort={sortBy === 'createdAt' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="sort-header-content">
                  <span>Enrolled On</span>
                  {renderSortIndicator('createdAt')}
                </div>
              </th>
              <th scope="col" style={{ textAlign: 'center' }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading Shimmer Skeleton */}
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="skeleton-row" aria-hidden="true">
                  <td><div className="skeleton-shimmer" style={{ width: '80px' }} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <div className="skeleton-shimmer" style={{ width: '140px', height: '14px' }} />
                        <div className="skeleton-shimmer" style={{ width: '180px', height: '12px' }} />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton-shimmer" style={{ width: '120px' }} /></td>
                  <td><div className="skeleton-shimmer" style={{ width: '60px' }} /></td>
                  <td><div className="skeleton-shimmer" style={{ width: '100px' }} /></td>
                  <td><div className="skeleton-shimmer" style={{ width: '90px' }} /></td>
                  <td><div className="skeleton-shimmer" style={{ width: '80px', margin: '0 auto' }} /></td>
                </tr>
              ))
            ) : students.length === 0 ? (
              /* Empty State */
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon-box" aria-hidden="true">
                      <UserX size={36} />
                    </div>
                    <h3 className="empty-title">No Students Found</h3>
                    <p className="empty-desc">
                      No student records match your query. Try clearing your search filters or register a new student.
                    </p>
                    {onAddNew && (
                      <button className="btn btn-primary" onClick={onAddNew}>
                        <Plus size={16} aria-hidden="true" />
                        <span>Add Student Now</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              /* Student Rows */
              students.map((student) => (
                <tr key={student._id}>
                  {/* Student ID */}
                  <td>
                    <span className="student-id-badge">{student.studentId}</span>
                  </td>

                  {/* Student Name & Email */}
                  <td>
                    <div className="student-profile">
                      <div className="student-avatar" aria-hidden="true">
                        {getInitials(student.name)}
                      </div>
                      <div className="student-name-block">
                        <span className="student-name">{student.name}</span>
                        <a
                          href={`mailto:${student.email}`}
                          className="student-email"
                          title={`Email ${student.email}`}
                        >
                          {student.email}
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td>
                    <span className="dept-badge">{student.department}</span>
                  </td>

                  {/* Semester */}
                  <td>
                    <span className="sem-badge">Sem {student.semester}</span>
                  </td>

                  {/* Contact */}
                  <td>
                    {student.contact ? (
                      <a
                        href={`tel:${student.contact}`}
                        className="text-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                      >
                        <Phone size={13} aria-hidden="true" />
                        <span>{student.contact}</span>
                      </a>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>

                  {/* Enrolled Date */}
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(student.createdAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        className="btn-icon edit"
                        onClick={() => onEditStudent(student)}
                        title={`Edit ${student.name}`}
                        aria-label={`Edit ${student.name}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => onDeleteStudent(student)}
                        title={`Delete ${student.name}`}
                        aria-label={`Delete ${student.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && students.length > 0 && pagination.totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total students)
          </div>

          <div className="pagination-controls">
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="page-indicator">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
