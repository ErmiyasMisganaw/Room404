<<<<<<< HEAD
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
=======
import React, { useCallback, useContext, createContext, useMemo, useRef, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const API = 'http://localhost:8000/api';

// ---------------------------------------------------------------------------
// Auth context (mirrors AuthContext.jsx shape for this component)
// ---------------------------------------------------------------------------
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e

const AuthContext = createContext({
  user: { id: 'CU-9001', name: 'Ruth G.', roomNumber: '212', role: 'customer' },
  logout: () => {},
});

// ---------------------------------------------------------------------------
// Local data hooks
// ---------------------------------------------------------------------------

const initialCleaningRequests = [
  { id: 'clean-1', title: 'Daily room cleaning', details: 'Please clean room after 2 PM.', status: 'Pending', createdAt: '2026-04-03T08:00:00.000Z' },
];
const initialMaintenanceRequests = [
  { id: 'maint-1', title: 'Air conditioner issue', details: 'AC is not cooling properly.', status: 'In Progress', createdAt: '2026-04-03T09:20:00.000Z' },
];
const initialCafeteriaOrders = [
  { id: 'cafe-1', title: 'Lunch order', details: 'Pasta x1, Orange Juice x1', status: 'Approved', createdAt: '2026-04-03T10:10:00.000Z' },
];
const initialPayments = [
  { id: 'pay-1', serviceType: 'Cleaning', dateTime: '2026-04-03T08:30:00.000Z', cost: 8, status: 'Unpaid' },
  { id: 'pay-2', serviceType: 'Maintenance', dateTime: '2026-04-03T09:45:00.000Z', cost: 12, status: 'Paid' },
  { id: 'pay-3', serviceType: 'Cafeteria', dateTime: '2026-04-03T10:20:00.000Z', cost: 18, status: 'Unpaid' },
];

function useCleaningRequests() {
  const [requests, setRequests] = useState(initialCleaningRequests);
<<<<<<< HEAD

  const createRequest = async ({ title, details, requestId }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    const nextRequest = {
      id: requestId || `clean-${Date.now()}`,
      title,
      details,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((previous) => [nextRequest, ...previous]);
    return nextRequest;
  };

  return { requests, createRequest, setRequests };
=======
  const createRequest = async ({ title, details }) => {
    await delay(700);
    const req = { id: `clean-${Date.now()}`, title, details, status: 'Pending', createdAt: new Date().toISOString() };
    setRequests((prev) => [req, ...prev]);
    return req;
  };
  return { requests, createRequest };
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
}

function useMaintenanceRequests() {
  const [requests, setRequests] = useState(initialMaintenanceRequests);
<<<<<<< HEAD

  const createRequest = async ({ title, details, requestId }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 750);
    });

    const nextRequest = {
      id: requestId || `maint-${Date.now()}`,
      title,
      details,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((previous) => [nextRequest, ...previous]);
    return nextRequest;
  };

  return { requests, createRequest, setRequests };
=======
  const createRequest = async ({ title, details }) => {
    await delay(750);
    const req = { id: `maint-${Date.now()}`, title, details, status: 'Pending', createdAt: new Date().toISOString() };
    setRequests((prev) => [req, ...prev]);
    return req;
  };
  return { requests, createRequest };
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
}

function useCafeteriaOrders() {
  const [requests, setRequests] = useState(initialCafeteriaOrders);
<<<<<<< HEAD

  const createRequest = async ({ title, details, requestId }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });

    const nextRequest = {
      id: requestId || `cafe-${Date.now()}`,
      title,
      details,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((previous) => [nextRequest, ...previous]);
    return nextRequest;
  };

  return { requests, createRequest, setRequests };
=======
  const createRequest = async ({ title, details }) => {
    await delay(800);
    const req = { id: `cafe-${Date.now()}`, title, details, status: 'Pending', createdAt: new Date().toISOString() };
    setRequests((prev) => [req, ...prev]);
    return req;
  };
  return { requests, createRequest };
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
}

function usePaymentTracker() {
  const [payments] = useState(initialPayments);
  return { payments, loading: false };
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// Voice input hook (Web Speech API)
// ---------------------------------------------------------------------------

function useVoiceInput(onResult) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = () => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, startListening, stopListening, supported };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${t.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{t.message}</p>
            <button type="button" onClick={() => onDismiss(t.id)} className="text-xs font-semibold text-gray-600 transition hover:text-gray-900">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ customer, stats, onLogout, wsConnected }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            {customer.name} • Room #{customer.roomNumber}
            <span className={`inline-block h-2 w-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-gray-300'}`} title={wsConnected ? 'Live' : 'Connecting…'} />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatCard label="Total Services Requested" value={stats.totalServicesRequested} />
          <StatCard label="Current Charges" value={`$${stats.currentCharges.toFixed(2)}`} />
        </div>
        <button type="button" onClick={onLogout} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500">
          Logout
        </button>
      </div>
    </header>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = {
    Pending: 'border-orange-200 bg-orange-100 text-orange-700',
    'In Progress': 'border-yellow-200 bg-yellow-100 text-yellow-700',
    Completed: 'border-green-200 bg-green-100 text-green-700',
    Done: 'border-green-200 bg-green-100 text-green-700',
    Approved: 'border-green-200 bg-green-100 text-green-700',
    Rejected: 'border-red-200 bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || 'border-gray-200 bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function RequestCard({ request }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{request.title}</p>
        <StatusBadge status={request.status} />
      </div>
      <p className="mt-2 text-sm text-gray-700">{request.details}</p>
      <p className="mt-2 text-xs text-gray-500">{new Date(request.createdAt).toLocaleString()}</p>
    </article>
  );
}

function ServiceRequestPanel({ serviceKey, title, placeholder, inputValue, onInputChange, onSubmit, requests, loading }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(serviceKey); }}>
        <input type="text" value={inputValue} onChange={(e) => onInputChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
          Submit Request
        </button>
      </form>
      <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold text-gray-800">Existing Requests</p>
        {requests.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">No requests yet.</div>}
        {requests.map((r) => <RequestCard key={r.id} request={r} />)}
      </div>
    </section>
  );
}

// Live task status banner
function LiveStatusBar({ liveTask }) {
  if (!liveTask) return null;

  const statusConfig = {
    Pending:      { bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400 animate-pulse', text: 'text-orange-700', label: 'Request received — staff being notified…' },
    'In Progress':{ bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-400 animate-pulse',   text: 'text-blue-700',   label: 'Staff is on the way!' },
    Done:         { bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500',                text: 'text-green-700', label: 'Request completed!' },
    Completed:    { bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500',                text: 'text-green-700', label: 'Request completed!' },
  };
  const cfg = statusConfig[liveTask.status] || statusConfig['Pending'];

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${cfg.bg}`}>
      <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
      <div>
        <p className={`text-sm font-semibold ${cfg.text}`}>Live Status — {liveTask.category} Request</p>
        <p className={`text-xs ${cfg.text}`}>{cfg.label} (Task #{liveTask.taskId})</p>
      </div>
      <StatusBadge status={liveTask.status} />
    </div>
  );
}

// AI Chat panel with voice-to-text
function AIChatPanel({ value, onChange, onSubmit, loading, aiResponse, voiceHook }) {
  const { isListening, startListening, stopListening, supported } = voiceHook;

  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-xl shadow-violet-100">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">AI Room Assistant</h2>
        <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">Powered by Gemini</span>
      </div>
      <p className="mt-1 text-sm text-gray-600">Describe your need in natural language — the AI will route it to the right team instantly.</p>

      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={isListening ? 'Listening…' : 'e.g. "I need extra pillows and my AC is broken"'}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-4 ${isListening ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-violet-200 bg-violet-50 focus:border-violet-500 focus:ring-violet-100'}`}
          />
          {supported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`absolute bottom-2 right-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isListening ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-violet-200 text-violet-700 hover:bg-violet-300'}`}
            >
              {isListening ? '⏹ Stop' : '🎤 Speak'}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-violet-200" />}
          {loading ? 'Processing…' : 'Send to AI'}
        </button>
      </form>

      {aiResponse && (
        <div className="mt-4 space-y-2">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
            <p className="font-semibold text-violet-700 mb-1">AI Response</p>
            <p>{aiResponse.response_to_guest}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">Category: {aiResponse.category}</span>
            <span className={`rounded-full px-2.5 py-1 font-medium ${aiResponse.priority === 'High' ? 'bg-red-100 text-red-700' : aiResponse.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              Priority: {aiResponse.priority}
            </span>
            {aiResponse.task_id && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-700">Task #{aiResponse.task_id} assigned</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentTracker({ payments, loading, roomStayCost }) {
  const totalServiceCharges = payments.reduce((s, p) => s + p.cost, 0);
  const totalCharges = totalServiceCharges + roomStayCost;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Payment Tracker</h2>
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-blue-200" />
          Loading…
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="even:bg-gray-50 hover:bg-blue-50/60">
                  <td className="px-3 py-2 text-gray-800">{p.serviceType}</td>
                  <td className="px-3 py-2 text-gray-700">{new Date(p.dateTime).toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-800">${p.cost.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            <p><span className="font-semibold">Total Service Charges:</span> ${totalServiceCharges.toFixed(2)}</p>
            <p><span className="font-semibold">Room Stay Cost:</span> ${roomStayCost.toFixed(2)}</p>
            <p className="mt-1 text-base font-bold">Total: ${totalCharges.toFixed(2)}</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export default function CustomerDashboard() {
<<<<<<< HEAD
  const { user, logout } = useAuth();
  const {
    requests: cleaningRequests,
    createRequest: createCleaningRequest,
    setRequests: setCleaningRequests,
  } = useCleaningRequests();
  const {
    requests: maintenanceRequests,
    createRequest: createMaintenanceRequest,
    setRequests: setMaintenanceRequests,
  } = useMaintenanceRequests();
  const {
    requests: cafeteriaOrders,
    createRequest: createCafeteriaOrder,
    setRequests: setCafeteriaOrders,
  } = useCafeteriaOrders();
  const { parseRequest } = useNaturalLanguageRequest();
=======
  const { user, logout } = useContext(AuthContext);
  const { requests: cleaningRequests, createRequest: createCleaningRequest } = useCleaningRequests();
  const { requests: maintenanceRequests, createRequest: createMaintenanceRequest } = useMaintenanceRequests();
  const { requests: cafeteriaOrders, createRequest: createCafeteriaOrder } = useCafeteriaOrders();
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
  const { payments, loading: paymentsLoading } = usePaymentTracker();

  const [activeServiceTab, setActiveServiceTab] = useState('cleaning');
  const [serviceInputs, setServiceInputs] = useState({ cleaning: '', maintenance: '', cafeteria: '' });
  const [nlText, setNlText] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [loadingService, setLoadingService] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [toasts, setToasts] = useState([]);
<<<<<<< HEAD
  const [staffUpdates, setStaffUpdates] = useState([]);
=======
  const [liveTask, setLiveTask] = useState(null); // { taskId, category, status }
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e

  const roomStayCost = 120;

  // WebSocket: listen for task status updates
  const { connected: wsConnected } = useWebSocket(useCallback((event) => {
    if (event.type === 'task_updated' && liveTask && event.data.id === liveTask.taskId) {
      setLiveTask((prev) => prev ? { ...prev, status: event.data.status } : prev);
    }
  }, [liveTask]));

  // Voice input → paste transcript into NL text box
  const voiceHook = useVoiceInput((transcript) => setNlText(transcript));

  const stats = useMemo(() => ({
    totalServicesRequested: cleaningRequests.length + maintenanceRequests.length + cafeteriaOrders.length,
    currentCharges: payments.reduce((s, p) => s + p.cost, 0) + roomStayCost,
  }), [cleaningRequests.length, maintenanceRequests.length, cafeteriaOrders.length, payments]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const updateServiceInput = (key, value) => setServiceInputs((prev) => ({ ...prev, [key]: value }));

  const submitServiceRequest = async (serviceKey, requestText, source = 'manual') => {
    if (!requestText.trim()) { pushToast('Please provide request details.', 'error'); return; }
    try {
      setLoadingService(serviceKey);
<<<<<<< HEAD
      const payload = {
        title: source === 'ai' ? `AI ${serviceKey} request` : `${serviceKey} request`,
        details: requestText,
      };

      const categoryByService = {
        cleaning: 'Workers',
        maintenance: 'Maintenance',
        cafeteria: 'Food',
      };
      const priorityByService = {
        cleaning: 'Medium',
        maintenance: 'High',
        cafeteria: 'Low',
      };

      const dispatchResult = await apiPost('/api/dispatch', {
        category: categoryByService[serviceKey] || 'Ignore',
        response_to_guest: `Thank you ${user.name}. Your ${serviceKey} request is received and being processed.`,
        staff_instruction: requestText,
        priority: priorityByService[serviceKey] || 'Low',
      });

      const backendInstructionId = dispatchResult?.routed_instruction?.instruction_id;

      if (serviceKey === 'cleaning') {
        await createCleaningRequest({ ...payload, requestId: backendInstructionId });
      } else if (serviceKey === 'maintenance') {
        await createMaintenanceRequest({ ...payload, requestId: backendInstructionId });
      } else {
        await createCafeteriaOrder({ ...payload, requestId: backendInstructionId });
      }

      if (source === 'manual') {
        updateServiceInput(serviceKey, '');
      }

      pushToast(`${serviceKey} request submitted successfully.`, 'success');
=======
      const payload = { title: source === 'ai' ? `AI ${serviceKey} request` : `${serviceKey} request`, details: requestText };
      if (serviceKey === 'cleaning') await createCleaningRequest(payload);
      else if (serviceKey === 'maintenance') await createMaintenanceRequest(payload);
      else await createCafeteriaOrder(payload);
      if (source === 'manual') updateServiceInput(serviceKey, '');
      pushToast(`${serviceKey} request submitted.`, 'success');
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
      setActiveServiceTab(serviceKey);
    } catch {
      pushToast('Failed to submit request.', 'error');
    } finally {
      setLoadingService('');
    }
  };

  const handleAISubmit = async () => {
    if (!nlText.trim()) { pushToast('Please type or speak a request first.', 'error'); return; }
    try {
      setLoadingAi(true);
      setAiResponse(null);

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: nlText, room_number: user?.roomNumber || '101' }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiResponse(data);

      // Set live status tracker if a task was created
      if (data.task_id) {
        setLiveTask({ taskId: data.task_id, category: data.category, status: 'Pending' });
      }

      // Also add to the correct local list for visibility
      const catMap = { Food: 'cafeteria', Maintenance: 'maintenance', Workers: 'cleaning' };
      const svc = catMap[data.category];
      if (svc) await submitServiceRequest(svc, nlText, 'ai');

      setNlText('');
      pushToast(`Request routed to ${data.category} team.`, 'success');
    } catch (err) {
      pushToast(`AI request failed: ${err.message}`, 'error');
    } finally {
      setLoadingAi(false);
    }
  };

<<<<<<< HEAD
  const handleLogout = () => {
    logout?.();
    window.location.href = '/login';
  };

  useEffect(() => {
    const syncFeedback = async () => {
      try {
        const [workers, maintenance, food] = await Promise.all([
          apiGet('/api/feedback/task-state/queue/workers'),
          apiGet('/api/feedback/task-state/queue/maintenance'),
          apiGet('/api/feedback/task-state/queue/food'),
        ]);

        const allUpdates = [
          ...(workers.items || []),
          ...(maintenance.items || []),
          ...(food.items || []),
        ];

        const feedbackMap = new Map(allUpdates.map((item) => [item.instruction_id, item]));

        setCleaningRequests((previous) =>
          previous.map((request) => ({
            ...request,
            status: feedbackMap.get(request.id)?.state || request.status,
          }))
        );
        setMaintenanceRequests((previous) =>
          previous.map((request) => ({
            ...request,
            status: feedbackMap.get(request.id)?.state || request.status,
          }))
        );
        setCafeteriaOrders((previous) =>
          previous.map((request) => {
            const state = feedbackMap.get(request.id)?.state;
            return {
              ...request,
              status: state === 'Completed' ? 'Approved' : state || request.status,
            };
          })
        );

        setStaffUpdates(allUpdates.slice(0, 6));
      } catch {
        setStaffUpdates([]);
      }
    };

    syncFeedback();
    const pollId = window.setInterval(syncFeedback, 15000);
    return () => window.clearInterval(pollId);
  }, [setCafeteriaOrders, setCleaningRequests, setMaintenanceRequests]);

  const serviceTabs = [
    { key: 'cleaning', label: 'Cleaning Requests' },
    { key: 'maintenance', label: 'Maintenance Requests' },
    { key: 'cafeteria', label: 'Cafeteria Orders' },
  ];
=======
  const handleLogout = () => { logout?.(); window.location.href = '/login'; };
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e

  const activePanelConfig = {
    cleaning:    { title: 'Cleaning Requests',    placeholder: 'Extra towels, floor cleanup…',        requests: cleaningRequests },
    maintenance: { title: 'Maintenance Requests', placeholder: 'Water heater not working…',           requests: maintenanceRequests },
    cafeteria:   { title: 'Cafeteria Orders',     placeholder: '1 grilled chicken, 2 sparkling waters…', requests: cafeteriaOrders },
  };
  const activePanel = activePanelConfig[activeServiceTab];

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar customer={user} stats={stats} onLogout={handleLogout} wsConnected={wsConnected} />

      <LiveStatusBar liveTask={liveTask} />

      {/* Service tabs */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {[{ key: 'cleaning', label: 'Cleaning' }, { key: 'maintenance', label: 'Maintenance' }, { key: 'cafeteria', label: 'Cafeteria' }].map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveServiceTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeServiceTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-6">
          <ServiceRequestPanel
            serviceKey={activeServiceTab}
            title={activePanel.title}
            placeholder={activePanel.placeholder}
            inputValue={serviceInputs[activeServiceTab]}
            onInputChange={(v) => updateServiceInput(activeServiceTab, v)}
            onSubmit={(key) => submitServiceRequest(key, serviceInputs[key], 'manual')}
            requests={activePanel.requests}
            loading={loadingService === activeServiceTab}
          />
          <AIChatPanel
            value={nlText}
            onChange={setNlText}
            onSubmit={handleAISubmit}
            loading={loadingAi}
            aiResponse={aiResponse}
            voiceHook={voiceHook}
          />
        </section>

        <section>
          <PaymentTracker payments={payments} loading={paymentsLoading} roomStayCost={roomStayCost} />

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900">Live Staff Updates</h2>
            <div className="mt-3 space-y-2 text-sm">
              {staffUpdates.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-gray-500">
                  No live updates yet.
                </p>
              )}

              {staffUpdates.map((update) => (
                <div key={update.instruction_id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="font-semibold text-gray-900">{update.queue.toUpperCase()} • {update.state}</p>
                  <p className="text-gray-600">{update.staff_note || 'Staff is processing your request.'}</p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
