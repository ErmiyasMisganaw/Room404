const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

export function sendChat(message, roomNumber = 'Unknown') {
  return apiPost('/api/chat', {message, room_number: roomNumber});
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

export {API_BASE_URL};
