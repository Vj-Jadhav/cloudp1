import React from 'react';
import { Search, X, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';

export const SearchFilterBar = ({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  semester,
  onSemesterChange,
  sortBy,
  onSortByChange,
  order,
  onOrderToggle,
  onResetFilters,
  departmentsList = [],
}) => {
  const hasActiveFilters = Boolean(search || department || semester || sortBy !== 'createdAt');

  return (
    <div className="toolbar-card" role="search" aria-label="Student search and filter toolbar">
      <div className="toolbar-grid">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} aria-hidden="true" />
          <input
            id="search-students-input"
            type="text"
            className="form-control with-icon"
            placeholder="Search by student ID, name, or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search students by ID, name, or email"
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
              aria-label="Clear search input"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div>
          <label htmlFor="filter-department" className="sr-only" style={{ display: 'none' }}>
            Filter by Department
          </label>
          <select
            id="filter-department"
            className="form-control"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            aria-label="Filter by academic department"
          >
            <option value="">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <label htmlFor="filter-semester" className="sr-only" style={{ display: 'none' }}>
            Filter by Semester
          </label>
          <select
            id="filter-semester"
            className="form-control"
            value={semester}
            onChange={(e) => onSemesterChange(e.target.value)}
            aria-label="Filter by semester"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <option key={num} value={num}>
                Semester {num}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Field */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            id="sort-by-select"
            className="form-control"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            aria-label="Sort records by"
          >
            <option value="createdAt">Sort: Enrolled Date</option>
            <option value="name">Sort: Full Name</option>
            <option value="studentId">Sort: Student ID</option>
            <option value="semester">Sort: Semester</option>
            <option value="department">Sort: Department</option>
          </select>

          {/* Sort Order Direction Toggle */}
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onOrderToggle}
            title={`Sort order: ${order === 'asc' ? 'Ascending' : 'Descending'}`}
            aria-label={`Toggle sort order. Currently ${order === 'asc' ? 'ascending' : 'descending'}`}
          >
            {order === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
        </div>

        {/* Reset Filters Button */}
        <div>
          <button
            id="btn-reset-filters"
            type="button"
            className="btn btn-secondary"
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
            title="Reset all active search and filters"
            aria-label="Reset all search and filters"
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
