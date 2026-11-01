import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import SearchFilterBar from './components/SearchFilterBar';
import StudentTable from './components/StudentTable';
import StudentModal from './components/StudentModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ToastContainer from './components/ToastContainer';
import studentApi from './services/api';

export function App() {
  // Data States
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Health / Connection State
  const [healthStatus, setHealthStatus] = useState('CHECKING');
  const [healthInfo, setHealthInfo] = useState(null);

  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modal States
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Check Backend Health
  const checkServerHealth = useCallback(async () => {
    try {
      const data = await studentApi.checkHealth();
      setHealthStatus(data.status === 'UP' ? 'UP' : 'DEGRADED');
      setHealthInfo(data);
    } catch {
      setHealthStatus('DOWN');
      setHealthInfo(null);
    }
  }, []);

  // Fetch Students (supports silent real-time background sync without table flicker)
  const loadStudents = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await studentApi.getStudents({
        search: debouncedSearch,
        department,
        semester,
        page,
        limit,
        sortBy,
        order,
      });

      if (response.success) {
        setStudents(response.data || []);
        setPagination(
          response.pagination || {
            total: response.count || 0,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
        setTotalCount(response.pagination?.total ?? response.count ?? 0);
      }
    } catch (err) {
      if (!isSilent) {
        console.error('Failed to load students:', err);
        addToast(
          'error',
          err.message || 'Failed to communicate with the backend API.',
          'Network Error'
        );
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [debouncedSearch, department, semester, page, limit, sortBy, order, addToast]);

  // Manual Refresh Handler
  const handleManualRefresh = useCallback(async () => {
    await Promise.all([loadStudents(false), checkServerHealth()]);
    addToast('info', 'Student records updated from MongoDB Atlas.', 'Refreshed');
  }, [loadStudents, checkServerHealth, addToast]);

  // Initial load and fast 3-second real-time auto-sync (instant Claude MCP updates)
  useEffect(() => {
    loadStudents(false);
    checkServerHealth();

    const onFocus = () => {
      loadStudents(true);
      checkServerHealth();
    };
    window.addEventListener('focus', onFocus);
    // Real-time polling every 3 seconds so Claude MCP edits reflect instantly
    const interval = setInterval(() => {
      loadStudents(true);
      checkServerHealth();
    }, 3000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [loadStudents, checkServerHealth]);

  // List of unique departments for filter dropdown
  const departmentsList = useMemo(() => {
    const defaultDepts = [
      'Computer Science',
      'Information Technology',
      'Electronics & Communication',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Biotechnology',
      'Data Science & AI',
    ];
    const fromData = students.map((s) => s.department).filter(Boolean);
    return Array.from(new Set([...defaultDepts, ...fromData])).sort();
  }, [students]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDepartment('');
    setSemester('');
    setSortBy('createdAt');
    setOrder('desc');
    setPage(1);
  };

  // Sort toggle or change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleOrderToggle = () => {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  // Modal Handlers
  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setStudentModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setStudentToEdit(student);
    setStudentModalOpen(true);
  };

  const handleCloseStudentModal = () => {
    if (!isSubmitting) {
      setStudentModalOpen(false);
      setStudentToEdit(null);
    }
  };

  // Submit Student (Create or Update)
  const handleSubmitStudent = async (studentData) => {
    setIsSubmitting(true);
    try {
      if (studentToEdit) {
        // Update
        const res = await studentApi.updateStudent(studentToEdit._id, studentData);
        if (res.success) {
          addToast('success', `Student "${res.data.name}" updated successfully.`, 'Record Updated');
          setStudentModalOpen(false);
          setStudentToEdit(null);
          loadStudents();
        }
      } else {
        // Create
        const res = await studentApi.createStudent(studentData);
        if (res.success) {
          addToast(
            'success',
            `Student "${res.data.name}" (${res.data.studentId}) registered successfully.`,
            'Student Created'
          );
          setStudentModalOpen(false);
          setStudentToEdit(null);
          loadStudents();
        }
      }
    } catch (err) {
      console.error('Error submitting student:', err);
      const errMsg =
        err.data?.message || err.message || 'An error occurred while saving student record.';
      addToast('error', errMsg, err.errorType === 'Conflict' ? 'Duplicate Identifier' : 'Submission Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await studentApi.deleteStudent(studentToDelete._id);
      if (res.success) {
        addToast(
          'success',
          `Student "${studentToDelete.name}" (${studentToDelete.studentId}) was permanently removed.`,
          'Record Deleted'
        );
        setDeleteModalOpen(false);
        setStudentToDelete(null);
        loadStudents();
      }
    } catch (err) {
      console.error('Failed to delete student:', err);
      addToast('error', err.message || 'Failed to delete student record.', 'Delete Error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        onAddClick={handleOpenAdd}
        healthStatus={healthStatus}
        healthInfo={healthInfo}
        onRefresh={handleManualRefresh}
        loading={loading}
      />

      <main>
        {/* Metric Summary Cards */}
        <SummaryCards
          students={students}
          totalCount={totalCount}
          healthInfo={healthInfo}
        />

        {/* Search, Filter & Sort Toolbar */}
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={(dept) => {
            setDepartment(dept);
            setPage(1);
          }}
          semester={semester}
          onSemesterChange={(sem) => {
            setSemester(sem);
            setPage(1);
          }}
          sortBy={sortBy}
          onSortByChange={(val) => {
            setSortBy(val);
            setPage(1);
          }}
          order={order}
          onOrderToggle={handleOrderToggle}
          onResetFilters={handleResetFilters}
          departmentsList={departmentsList}
        />

        {/* Responsive Student Records Table */}
        <StudentTable
          students={students}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onEditStudent={handleOpenEdit}
          onDeleteStudent={handleOpenDelete}
          onAddNew={handleOpenAdd}
          sortBy={sortBy}
          order={order}
          onSortChange={handleSortChange}
        />
      </main>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={studentModalOpen}
        onClose={handleCloseStudentModal}
        onSubmit={handleSubmitStudent}
        studentToEdit={studentToEdit}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        student={studentToDelete}
        isDeleting={isDeleting}
      />

      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Student Information Management System • Three-Tier Cloud Architecture (React/Vite + Node/Express + MongoDB Atlas)
        </p>
      </footer>
    </div>
  );
}

export default App;
