import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  student,
  isDeleting = false,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !student) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="modal-body" style={{ paddingBottom: '1rem' }}>
          <div className="confirm-box">
            <div className="confirm-icon-box" aria-hidden="true">
              <AlertTriangle size={24} />
            </div>
            <div className="confirm-content">
              <h3 id="delete-dialog-title">Delete Student Record?</h3>
              <p>
                Are you sure you want to permanently delete this student record? This action cannot be undone.
              </p>
              <div className="confirm-target-info">
                <strong>{student.name}</strong> ({student.studentId})<br />
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {student.department} • Semester {student.semester}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
