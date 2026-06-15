export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';
//export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
// FastAPI gateway base for the Node.js + MongoDB task service.
export const GATEWAY_BASE = import.meta.env.VITE_GATEWAY_BASE || 'http://localhost:8000';

export function authHeaders(session) {
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function fetchDashboardSummary(session) {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`, {
    headers: authHeaders(session),
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'Dashboard summary unavailable'));
  return response.json();
}

export async function fetchDepartmentActivity(session) {
  const response = await fetch(`${API_BASE}/api/dashboard/department-activity`, {
    headers: authHeaders(session),
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'Department activity unavailable'));
  return response.json();
}

export async function fetchReports(session) {
  const response = await fetch(`${API_BASE}/api/reports`, {
    headers: authHeaders(session),
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'Reports unavailable'));
  return response.json();
}

export async function fetchRecentReports(session) {
  const response = await fetch(`${API_BASE}/api/reports/recent`, {
    headers: authHeaders(session),
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'Recent reports unavailable'));
  return response.json();
}

export async function createReport(session, report) {
  const response = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(session),
    },
    body: JSON.stringify(report),
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'Report generation failed'));
  return response.json();
}

export async function createReportFromCsv(session, report, file) {
  const formData = new FormData();
  Object.entries(report).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/reports/upload`, {
    method: 'POST',
    headers: authHeaders(session),
    body: formData,
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'CSV upload failed'));
  return response.json();
}

export async function deleteReport(session, reportId) {
  const response = await fetch(`${API_BASE}/api/reports/${reportId}`, {
    method: 'DELETE',
    headers: authHeaders(session),
  });
  if (!response.ok) throw new Error(await errorMessage(response, 'Report delete failed'));
}

export async function loginUser(credentials) {
  return authRequest('login', normalizeCredentials(credentials));
}

export async function registerUser(user) {
  return authRequest('register', user);
}

async function authRequest(endpoint, body) {
  const response = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await authErrorMessage(response, endpoint === 'register' ? 'Signup failed' : 'Invalid email or password'));
  }

  return response.json();
}

function normalizeCredentials(credentials) {
  return {
    ...credentials,
    email: String(credentials.email || '').trim(),
  };
}

async function authErrorMessage(response, fallback) {
  const body = await response.text();
  let message = body.trim();

  if (message.startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      message = parsed.detail || parsed.message || parsed.error || '';
    } catch {
      message = '';
    }
  }

  return message || fallback;
}

async function errorMessage(response, fallback) {
  const body = await response.text();
  let message = body.trim();

  if (message.startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      message = parsed.detail || parsed.message || parsed.error || message;
    } catch {
      // Keep the original body when it is not parseable JSON.
    }
  }

  if (message) return message;
  if (response.status === 401 || response.status === 403) {
    return 'Please sign in again before creating reports';
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Task service (Node.js + MongoDB) via FastAPI gateway: /taskservice -> /task
// ---------------------------------------------------------------------------

async function taskRequest(session, method, path, body) {
  const options = {
    method,
    headers: {
      ...authHeaders(session),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${GATEWAY_BASE}/taskservice/${path}`, options);
  if (!response.ok) throw new Error(await errorMessage(response, 'Task service error'));
  return response.json();
}

export function fetchTasks(session, page = 1, size = 6) {
  return taskRequest(session, 'GET', `getalltasks/${page}/${size}`);
}

export function searchTasks(session, keyword) {
  return taskRequest(session, 'GET', `vectorsearch/${encodeURIComponent(String(keyword).trim())}`);
}

export function getTask(session, id) {
  return taskRequest(session, 'GET', `gettask/${id}`);
}

export function createTask(session, task) {
  return taskRequest(session, 'POST', 'createtask', task);
}

export function updateTask(session, id, task) {
  return taskRequest(session, 'PUT', `updatetask/${id}`, task);
}

export function deleteTask(session, id) {
  return taskRequest(session, 'DELETE', `deletetask/${id}`);
}
