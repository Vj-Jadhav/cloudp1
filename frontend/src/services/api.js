/**
 * Reusable REST API Client for Student Information Management System
 * Connects exclusively via HTTP REST API to the Express backend.
 * Reads backend URL from import.meta.env.VITE_API_URL without hardcoding production endpoints.
 */

const RAW_API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_APT_URL ||
  'http://localhost:5000/api'
).trim().replace(/\/+$/, '');

// Normalize URL: ensure /api prefix is present exactly once without duplication
export const API_BASE_URL = RAW_API_URL.endsWith('/api')
  ? RAW_API_URL
  : `${RAW_API_URL}/api`;

/**
 * Generic fetch wrapper with timeout, JSON parsing, and unified error handling
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    config.signal = controller.signal;

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      // Standardize API error payload
      const error = new Error(
        data?.message ||
        (Array.isArray(data?.errors) ? data.errors.join(', ') : null) ||
        `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      error.errorType = data?.error || 'ApiError';
      error.errors = data?.errors || [];
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please check your backend connection.');
      timeoutError.status = 408;
      throw timeoutError;
    }
    // Network or server unreachable
    if (!err.status && err instanceof TypeError) {
      const netError = new Error(
        `Unable to connect to backend API at ${API_BASE_URL}. Ensure the Express server is running.`
      );
      netError.status = 0;
      netError.isNetworkError = true;
      throw netError;
    }
    throw err;
  }
};

/**
 * API Service Methods
 */
export const studentApi = {
  /**
   * Health Check
   */
  checkHealth: async () => {
    return request('/health');
  },

  /**
   * Get all students with query filters and pagination
   */
  getStudents: async (params = {}) => {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.department && params.department.trim()) {
      query.append('department', params.department.trim());
    }
    if (params.semester !== undefined && params.semester !== '') {
      query.append('semester', params.semester);
    }
    if (params.page) {
      query.append('page', params.page);
    }
    if (params.limit) {
      query.append('limit', params.limit);
    }
    if (params.sortBy) {
      query.append('sortBy', params.sortBy);
    }
    if (params.order) {
      query.append('order', params.order);
    }

    const queryString = query.toString();
    const endpoint = `/students${queryString ? `?${queryString}` : ''}`;
    return request(endpoint);
  },

  /**
   * Get a single student by MongoDB document ID
   */
  getStudentById: async (id) => {
    return request(`/students/${encodeURIComponent(id)}`);
  },

  /**
   * Create a new student record
   */
  createStudent: async (studentData) => {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  /**
   * Update an existing student record
   */
  updateStudent: async (id, studentData) => {
    return request(`/students/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  /**
   * Delete a student record
   */
  deleteStudent: async (id) => {
    return request(`/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export default studentApi;
