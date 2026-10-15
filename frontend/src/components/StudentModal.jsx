import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Data Science & AI',
];

export const StudentModal = ({
  isOpen,
  onClose,
  onSubmit,
  studentToEdit = null,
  isSubmitting = false,
}) => {
  const isEditMode = Boolean(studentToEdit);

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    department: 'Computer Science',
    semester: 1,
    contact: '',
  });

  const [errors, setErrors] = useState({});

  // Reset or populate form when modal opens or target student changes
  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        studentId: studentToEdit.studentId || '',
        name: studentToEdit.name || '',
        email: studentToEdit.email || '',
        department: studentToEdit.department || 'Computer Science',
        semester: studentToEdit.semester || 1,
        contact: studentToEdit.contact || '',
      });
    } else {
      setFormData({
        studentId: '',
        name: '',
        email: '',
        department: 'Computer Science',
        semester: 1,
        contact: '',
      });
    }
    setErrors({});
  }, [studentToEdit, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // studentId
    if (!formData.studentId || !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required.';
    } else if (!/^[A-Za-z0-9-_]+$/.test(formData.studentId.trim())) {
      newErrors.studentId = 'Student ID must only contain letters, numbers, hyphens, and underscores.';
    }

    // name
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    // email
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address (e.g. user@university.edu).';
    }

    // department
    if (!formData.department || !formData.department.trim()) {
      newErrors.department = 'Department is required.';
    }

    // semester
    const sem = Number(formData.semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
      newErrors.semester = 'Semester must be an integer between 1 and 12.';
    }

    // contact (optional)
    if (formData.contact && formData.contact.trim() !== '') {
      if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(formData.contact.trim())) {
        newErrors.contact = 'Please provide a valid phone number (7-15 digits).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? (value === '' ? '' : Number(value)) : value,
    }));

    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      ...formData,
      studentId: formData.studentId.trim().toUpperCase(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      department: formData.department.trim(),
      semester: Number(formData.semester),
      contact: formData.contact ? formData.contact.trim() : '',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="student-modal-title" className="modal-title">
              {isEditMode ? 'Edit Student Record' : 'Register New Student'}
            </h2>
            <p className="modal-subtitle">
              {isEditMode
                ? `Updating student details for ID ${formData.studentId}`
                : 'Enter institutional student information'}
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Student ID & Semester */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="studentId">
                  Student ID <span className="required">*</span>
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  placeholder="e.g. STU-2026-001"
                  className={`form-control ${errors.studentId ? 'is-invalid' : ''}`}
                  value={formData.studentId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoFocus
                />
                {errors.studentId ? (
                  <span className="field-error">
                    <AlertCircle size={14} /> {errors.studentId}
                  </span>
                ) : (
                  <span className="form-help">Uppercase alphanumeric code</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="semester">
                  Semester (1-12) <span className="required">*</span>
                </label>
                <select
                  id="semester"
                  name="semester"
                  className={`form-control ${errors.semester ? 'is-invalid' : ''}`}
                  value={formData.semester}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      Semester {num}
                    </option>
                  ))}
                </select>
                {errors.semester && (
                  <span className="field-error">
                    <AlertCircle size={14} /> {errors.semester}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Jane Cooper"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className="field-error">
                  <AlertCircle size={14} /> {errors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Institutional Email <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. jane.cooper@university.edu"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.email && (
                <span className="field-error">
                  <AlertCircle size={14} /> {errors.email}
                </span>
              )}
            </div>

            {/* Department & Contact */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department <span className="required">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  className={`form-control ${errors.department ? 'is-invalid' : ''}`}
                  value={formData.department}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <span className="field-error">
                    <AlertCircle size={14} /> {errors.department}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact">
                  Contact Number (Optional)
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  placeholder="+1-555-019-2834"
                  className={`form-control ${errors.contact ? 'is-invalid' : ''}`}
                  value={formData.contact}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.contact && (
                  <span className="field-error">
                    <AlertCircle size={14} /> {errors.contact}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              id="btn-submit-student"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Record' : 'Save Student'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
