import React, { useState } from 'react';
import {
  API_BASE_URL,
  checkoutRoom,
  completeCafeteriaTask,
  dispatchInstruction,
  getAnalytics,
  getCafeteriaAvailability,
  getHealth,
  getInbox,
  getRooms,
  getTaskFeedback,
  getTaskFeedbackQueue,
  getTasks,
  sendChat,
  updateCafeteriaAvailability,
  updateTaskStatus,
  upsertTaskFeedback,
} from '../services/api';

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function ApiWorkbench() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  const [chatMessage, setChatMessage] = useState('Please send 2 extra towels to room 210.');
  const [chatRoom, setChatRoom] = useState('210');

  const [taskId, setTaskId] = useState('');
  const [taskStatus, setTaskStatus] = useState('Done');

  const [checkoutRoomNumber, setCheckoutRoomNumber] = useState('102');

  const [dispatch, setDispatch] = useState({
    title: 'Customer request',
    description: 'Need extra pillow and a blanket.',
    category: 'cleaners',
    room: '210',
    priority: 'Medium',
  });

  const [inboxQueue, setInboxQueue] = useState('cleaners');

  const [feedback, setFeedback] = useState({
    instruction_id: '',
    queue_name: 'cleaners',
    state: 'pending',
    note: '',
  });

  const [feedbackInstructionId, setFeedbackInstructionId] = useState('');
  const [feedbackQueue, setFeedbackQueue] = useState('cleaners');

  const [availability, setAvailability] = useState({
    item_name: 'Pasta',
    available_quantity: 10,
    is_available: true,
    note: 'Updated from API workbench',
  });

  const [cafeteriaComplete, setCafeteriaComplete] = useState({
    instruction_id: '',
    note: 'Prepared and delivered.',
  });

  const run = async (label, fn) => {
    setLoading(label);
    setError('');
    try {
      const data = await fn();
      setResult(data);
    } catch (e) {
      setError(e?.message || 'Request failed');
    } finally {
      setLoading('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Backend API Workbench</h1>
          <p className="mt-1 text-sm text-slate-600">
            Test all FastAPI endpoints from one frontend screen.
          </p>
          <p className="mt-1 text-xs text-slate-500">Base URL: {API_BASE_URL}</p>
          {loading ? <p className="mt-2 text-sm font-medium text-indigo-600">Running: {loading}</p> : null}
          {error ? <p className="mt-2 text-sm font-medium text-rose-600">Error: {error}</p> : null}
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Health & Analytics">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run('GET /api/health', () => getHealth())} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">GET /health</button>
              <button onClick={() => run('GET /api/analytics', () => getAnalytics())} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">GET /analytics</button>
            </div>
          </Card>

          <Card title="Chat">
            <div className="space-y-2">
              <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="w-full rounded border p-2 text-sm" placeholder="Message" />
              <input value={chatRoom} onChange={(e) => setChatRoom(e.target.value)} className="w-full rounded border p-2 text-sm" placeholder="Room" />
              <button onClick={() => run('POST /api/chat', () => sendChat(chatMessage, chatRoom))} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">POST /chat</button>
            </div>
          </Card>

          <Card title="Tasks">
            <div className="space-y-2">
              <button onClick={() => run('GET /api/tasks', () => getTasks())} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">GET /tasks</button>
              <div className="grid grid-cols-2 gap-2">
                <input value={taskId} onChange={(e) => setTaskId(e.target.value)} className="rounded border p-2 text-sm" placeholder="Task ID" />
                <input value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="rounded border p-2 text-sm" placeholder="Status (e.g. Done)" />
              </div>
              <button onClick={() => run('PATCH /api/tasks/{id}', () => updateTaskStatus(taskId, taskStatus))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">PATCH /tasks/{'{id}'}</button>
            </div>
          </Card>

          <Card title="Rooms">
            <div className="space-y-2">
              <button onClick={() => run('GET /api/rooms', () => getRooms())} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">GET /rooms</button>
              <div className="flex gap-2">
                <input value={checkoutRoomNumber} onChange={(e) => setCheckoutRoomNumber(e.target.value)} className="flex-1 rounded border p-2 text-sm" placeholder="Room Number" />
                <button onClick={() => run('POST /api/rooms/{room}/checkout', () => checkoutRoom(checkoutRoomNumber))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Checkout</button>
              </div>
            </div>
          </Card>

          <Card title="Dispatch & Inbox">
            <div className="space-y-2">
              <input value={dispatch.title} onChange={(e) => setDispatch((p) => ({ ...p, title: e.target.value }))} className="w-full rounded border p-2 text-sm" placeholder="Title" />
              <textarea value={dispatch.description} onChange={(e) => setDispatch((p) => ({ ...p, description: e.target.value }))} className="w-full rounded border p-2 text-sm" rows={2} placeholder="Description" />
              <div className="grid grid-cols-3 gap-2">
                <input value={dispatch.category} onChange={(e) => setDispatch((p) => ({ ...p, category: e.target.value }))} className="rounded border p-2 text-sm" placeholder="Category" />
                <input value={dispatch.room} onChange={(e) => setDispatch((p) => ({ ...p, room: e.target.value }))} className="rounded border p-2 text-sm" placeholder="Room" />
                <input value={dispatch.priority} onChange={(e) => setDispatch((p) => ({ ...p, priority: e.target.value }))} className="rounded border p-2 text-sm" placeholder="Priority" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => run('POST /api/dispatch', () => dispatchInstruction(dispatch))} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">POST /dispatch</button>
                <input value={inboxQueue} onChange={(e) => setInboxQueue(e.target.value)} className="rounded border p-2 text-sm" placeholder="Queue" />
                <button onClick={() => run('GET /api/inbox/{queue}', () => getInbox(inboxQueue))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">GET /inbox</button>
              </div>
            </div>
          </Card>

          <Card title="Feedback APIs">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={feedback.instruction_id} onChange={(e) => setFeedback((p) => ({ ...p, instruction_id: e.target.value }))} className="rounded border p-2 text-sm" placeholder="instruction_id" />
                <input value={feedback.queue_name} onChange={(e) => setFeedback((p) => ({ ...p, queue_name: e.target.value }))} className="rounded border p-2 text-sm" placeholder="queue_name" />
                <input value={feedback.state} onChange={(e) => setFeedback((p) => ({ ...p, state: e.target.value }))} className="rounded border p-2 text-sm" placeholder="state" />
                <input value={feedback.note} onChange={(e) => setFeedback((p) => ({ ...p, note: e.target.value }))} className="rounded border p-2 text-sm" placeholder="note" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => run('POST /api/feedback/task-state', () => upsertTaskFeedback(feedback))} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">POST feedback</button>
                <input value={feedbackInstructionId} onChange={(e) => setFeedbackInstructionId(e.target.value)} className="rounded border p-2 text-sm" placeholder="instruction_id" />
                <button onClick={() => run('GET /api/feedback/task-state/{id}', () => getTaskFeedback(feedbackInstructionId))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">GET feedback by id</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input value={feedbackQueue} onChange={(e) => setFeedbackQueue(e.target.value)} className="rounded border p-2 text-sm" placeholder="queue_name" />
                <button onClick={() => run('GET /api/feedback/task-state/queue/{q}', () => getTaskFeedbackQueue(feedbackQueue))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">GET feedback queue</button>
              </div>
            </div>
          </Card>

          <Card title="Cafeteria APIs">
            <div className="space-y-2">
              <button onClick={() => run('GET /api/cafeteria/availability', () => getCafeteriaAvailability())} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">GET availability</button>
              <div className="grid grid-cols-2 gap-2">
                <input value={availability.item_name} onChange={(e) => setAvailability((p) => ({ ...p, item_name: e.target.value }))} className="rounded border p-2 text-sm" placeholder="item_name" />
                <input type="number" value={availability.available_quantity} onChange={(e) => setAvailability((p) => ({ ...p, available_quantity: Number(e.target.value) }))} className="rounded border p-2 text-sm" placeholder="available_quantity" />
                <select value={availability.is_available ? 'true' : 'false'} onChange={(e) => setAvailability((p) => ({ ...p, is_available: e.target.value === 'true' }))} className="rounded border p-2 text-sm">
                  <option value="true">available</option>
                  <option value="false">unavailable</option>
                </select>
                <input value={availability.note} onChange={(e) => setAvailability((p) => ({ ...p, note: e.target.value }))} className="rounded border p-2 text-sm" placeholder="note" />
              </div>
              <button onClick={() => run('POST /api/cafeteria/availability', () => updateCafeteriaAvailability(availability))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">POST availability</button>
              <div className="grid grid-cols-2 gap-2">
                <input value={cafeteriaComplete.instruction_id} onChange={(e) => setCafeteriaComplete((p) => ({ ...p, instruction_id: e.target.value }))} className="rounded border p-2 text-sm" placeholder="instruction_id" />
                <input value={cafeteriaComplete.note} onChange={(e) => setCafeteriaComplete((p) => ({ ...p, note: e.target.value }))} className="rounded border p-2 text-sm" placeholder="note" />
              </div>
              <button onClick={() => run('POST /api/cafeteria/complete-task', () => completeCafeteriaTask(cafeteriaComplete))} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">POST complete-task</button>
            </div>
          </Card>
        </div>

        <Card title="Latest Response">
          <pre className="max-h-[420px] overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {result ? JSON.stringify(result, null, 2) : 'No response yet.'}
          </pre>
        </Card>
      </div>
    </main>
  );
}
