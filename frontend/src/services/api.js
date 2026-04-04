function normalizeBaseUrl(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

const configuredApiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const fallbackApiBaseUrl = import.meta.env.DEV
  ? 'http://127.0.0.1:8000'
  : window.location.origin;

if (!configuredApiBaseUrl && !import.meta.env.DEV) {
  console.error(
    'VITE_API_BASE_URL is not set in production. Falling back to window.location.origin. '
    + 'Set VITE_API_BASE_URL to your backend Render URL.'
  );
}

const API_BASE_URL = configuredApiBaseUrl || fallbackApiBaseUrl;

const AUTH_HEADER_STORAGE_KEY = 'room404.auth-context';

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem(AUTH_HEADER_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    const headers = {};

    if (parsed?.role) {
      headers['x-user-role'] = `${parsed.role}`;
    }

    if (parsed?.email) {
      headers['x-user-email'] = `${parsed.email}`;
    }

    return headers;
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

export function apiGet(path) {
  return request(path, {method: 'GET'});
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function getHealth() {
  return apiGet('/api/health');
}

export function sendChat(messageOrPayload, roomNumber = 'Unknown', options = {}) {
  if (typeof messageOrPayload === 'object' && messageOrPayload !== null) {
    const payload = {
      name: messageOrPayload.name || 'Guest',
      message: messageOrPayload.message || '',
      room_number: messageOrPayload.room_number || 'Unknown',
      role: messageOrPayload.role || 'customer',
    };

    if (messageOrPayload.user_id) {
      payload.user_id = messageOrPayload.user_id;
    }

    return apiPost('/api/chat', payload);
  }

  const payload = {
    name: options.name || 'Guest',
    message: messageOrPayload || '',
    room_number: roomNumber,
    role: options.role || 'customer',
  };

  if (options.user_id) {
    payload.user_id = options.user_id;
  }

  return apiPost('/api/chat', payload);
}

export function getTasks() {
  return apiGet('/api/tasks');
}

export function updateTaskStatus(taskId, status) {
  return apiPatch(`/api/tasks/${taskId}`, {status});
}

export function getRooms() {
  return apiGet('/api/rooms');
}

export function checkoutRoom(roomNumber) {
  return apiPost(`/api/rooms/${roomNumber}/checkout`, {});
}

export function getAnalytics() {
  return apiGet('/api/analytics');
}

export function dispatchInstruction(payload) {
  return apiPost('/api/dispatch', payload);
}

export function getInbox(queueName) {
  return apiGet(`/api/inbox/${queueName}`);
}

export function upsertTaskFeedback(payload) {
  return apiPost('/api/feedback/task-state', payload);
}

export function getTaskFeedback(instructionId) {
  return apiGet(`/api/feedback/task-state/${instructionId}`);
}

export function getTaskFeedbackQueue(queueName) {
  return apiGet(`/api/feedback/task-state/queue/${queueName}`);
}

export function getCafeteriaAvailability() {
  return apiGet('/api/cafeteria/availability');
}

export function updateCafeteriaAvailability(payload) {
  return apiPost('/api/cafeteria/availability', payload);
}

export function completeCafeteriaTask(payload) {
  return apiPost('/api/cafeteria/complete-task', payload);
}

export function getCafeteriaAnalytics() {
  return apiGet('/api/cafeteria/analytics');
}

export function getMenu(includeUnavailable = false) {
  return apiGet(
      `/api/menu?include_unavailable=${includeUnavailable ? 'true' : 'false'}`);
}

export function getCustomerRequests(roomNumber) {
  const value = encodeURIComponent(`${roomNumber || ''}`.trim());
  return apiGet(`/api/customer/requests?room_number=${value}`);
}

export {API_BASE_URL};
