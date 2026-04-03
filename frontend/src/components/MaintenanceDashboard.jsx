<<<<<<< HEAD
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
=======
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const API = 'http://localhost:8000/api';
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e

const AuthContext = createContext({
  user: { id: 'MT-220', name: 'Abel K.', role: 'Maintenance Staff' },
  logout: () => {},
});

const initialIssues = [
  { id: 'issue-1', roomNumber: '208', issueType: 'Plumbing',     description: 'Bathroom sink leaking under cabinet.', reportedBy: 'Saron D.', status: 'Pending',     assignedStaff: 'Abel K.', backendId: null, customerFeedback: null },
  { id: 'issue-2', roomNumber: '315', issueType: 'Electricity',  description: 'Main lights flicker intermittently.',  reportedBy: 'Noah M.', status: 'In Progress', assignedStaff: 'Abel K.', backendId: null, customerFeedback: null },
  { id: 'issue-3', roomNumber: '109', issueType: 'HVAC',         description: 'AC not cooling the room.',             reportedBy: 'Mimi T.', status: 'Resolved',    assignedStaff: 'Abel K.', backendId: null, customerFeedback: 'Yes' },
];

function useAuth() { return useContext(AuthContext); }

function useIssues() {
  const [issues, setIssues] = useState(initialIssues);

<<<<<<< HEAD
  const toIssueType = (instruction) => {
    if (/ac|air|hvac|temperature/i.test(instruction)) return 'HVAC';
    if (/light|power|electric/i.test(instruction)) return 'Electricity';
    if (/water|leak|tap|plumb/i.test(instruction)) return 'Plumbing';
    return 'Maintenance';
  };

  const refreshIssues = async () => {
    try {
      const [inbox, feedback] = await Promise.all([
        apiGet('/api/inbox/maintenance'),
        apiGet('/api/feedback/task-state/queue/maintenance'),
      ]);

      const feedbackMap = new Map((feedback.items || []).map((item) => [item.instruction_id, item]));

      const mapped = (inbox.items || []).map((item) => {
        const matchedRoom = item.staff_instruction.match(/\b\d{2,4}\b/);
        const state = feedbackMap.get(item.instruction_id)?.state || 'Pending';
        const normalizedState = state === 'Completed' ? 'Resolved' : state;

        return {
          id: item.instruction_id,
          roomNumber: matchedRoom ? matchedRoom[0] : item.instruction_id.slice(-3),
          issueType: toIssueType(item.staff_instruction),
          description: item.staff_instruction,
          reportedBy: 'Customer',
          status: normalizedState,
          assignedStaff: 'Maintenance Team',
          customerFeedback: null,
        };
      });

      setIssues(mapped.length > 0 ? mapped : initialIssues);
    } catch {
      setIssues(initialIssues);
    }
  };

  useEffect(() => {
    refreshIssues();
    const pollId = window.setInterval(refreshIssues, 15000);

    return () => {
      window.clearInterval(pollId);
    };
  }, []);

  return { issues, setIssues, refreshIssues };
}

function useResolveIssue() {
  const resolveIssue = async (issueId) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 900);
=======
  // Simulated periodic feed
  useEffect(() => {
    const id = window.setInterval(() => {
      setIssues((prev) => {
        if (prev.length > 10 || Math.random() < 0.65) return prev;
        const types = ['Plumbing', 'Electricity', 'Furniture', 'HVAC', 'Internet'];
        const descs = ['Unusual noise from fixture.', 'Outlet not functioning.', 'Door lock issue.', 'Temperature control not responding.', 'Intermittent connectivity.'];
        const i = Math.floor(Math.random() * types.length);
        return [{ id: `issue-${Date.now()}`, roomNumber: String(100 + Math.floor(Math.random() * 350)), issueType: types[i], description: descs[i], reportedBy: 'Guest', status: 'Pending', assignedStaff: 'Unassigned', backendId: null, customerFeedback: null }, ...prev];
      });
    }, 20000);
    return () => window.clearInterval(id);
  }, []);

  const addIssueFromBackend = useCallback((backendTask) => {
    setIssues((prev) => {
      if (prev.some((i) => i.backendId === backendTask.id)) return prev;
      return [{
        id: `ws-${backendTask.id}`,
        backendId: backendTask.id,
        roomNumber: backendTask.room_number,
        issueType: 'AI-Reported',
        description: backendTask.description,
        reportedBy: `Room ${backendTask.room_number} Guest`,
        status: 'Pending',
        assignedStaff: 'Abel K.',
        customerFeedback: null,
        priority: backendTask.priority,
        staffInstruction: backendTask.staff_instruction,
      }, ...prev];
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
    });
  }, []);

  return { issues, setIssues, addIssueFromBackend };
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

function Navbar({ user, stats, onLogout, wsConnected }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Maintenance Dashboard</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            {user.name} • {user.role}
            <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-gray-300'}`} />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Assigned" value={stats.totalAssigned} />
          <StatCard label="Resolved Today" value={stats.resolvedToday} />
        </div>
        <button type="button" onClick={onLogout} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500">Logout</button>
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
  const cls = { Pending: 'border-orange-200 bg-orange-100 text-orange-700', 'In Progress': 'border-yellow-200 bg-yellow-100 text-yellow-700', Resolved: 'border-green-200 bg-green-100 text-green-700', Done: 'border-green-200 bg-green-100 text-green-700' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status] || 'border-gray-200 bg-gray-100 text-gray-700'}`}>{status}</span>;
}

function PriorityBadge({ priority }) {
  if (!priority) return null;
  const cls = { High: 'bg-red-100 text-red-700', Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-green-100 text-green-700' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls[priority] || 'bg-gray-100 text-gray-700'}`}>{priority}</span>;
}

function IssueCard({ issue, selected, onSelect, onResolve, onBackendResolve, loadingIssueId }) {
  const isLoading = loadingIssueId === issue.id;
  const isAI = Boolean(issue.backendId);
  const isDone = issue.status === 'Resolved' || issue.status === 'Done';

  return (
    <article className={`rounded-lg border p-4 shadow-sm transition ${selected ? 'border-blue-300 bg-blue-50 shadow-md' : `border-gray-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${isAI ? 'bg-violet-50' : 'bg-white'}`}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1">
            Room
            {isAI && <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-xs font-bold text-violet-700">AI</span>}
          </p>
          <p className="text-lg font-semibold text-gray-900">#{issue.roomNumber}</p>
        </div>
        <div className="flex items-center gap-1">
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p><span className="font-semibold">Type:</span> {issue.issueType}</p>
        <p><span className="font-semibold">Reported By:</span> {issue.reportedBy}</p>
        <p><span className="font-semibold">Staff:</span> {issue.assignedStaff}</p>
        {issue.staffInstruction && <p className="text-violet-700"><span className="font-semibold">Instruction:</span> {issue.staffInstruction}</p>}
      </div>
      <p className="mt-3 text-sm text-gray-700">{issue.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onSelect(issue)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">{selected ? 'Selected' : 'View Details'}</button>
        <button type="button" onClick={() => isAI ? onBackendResolve(issue) : onResolve(issue)} disabled={isDone || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-green-200" />}
          {isDone ? 'Resolved' : 'Resolve'}
        </button>
      </div>
    </article>
  );
}

function IssueDetails({ issue, onResolve, onBackendResolve, loadingIssueId }) {
  if (!issue) return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Issue Details</h2><p className="mt-2 text-sm text-gray-600">Select an issue to view details.</p></section>;
  const isLoading = loadingIssueId === issue.id;
  const isDone = issue.status === 'Resolved' || issue.status === 'Done';
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Issue Details</h2>
      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p><span className="font-semibold">Room:</span> #{issue.roomNumber}</p>
        <p><span className="font-semibold">Type:</span> {issue.issueType}</p>
        <p><span className="font-semibold">Description:</span> {issue.description}</p>
        {issue.staffInstruction && <p><span className="font-semibold">Instruction:</span> {issue.staffInstruction}</p>}
        <p><span className="font-semibold">Reported By:</span> {issue.reportedBy}</p>
        <p><span className="font-semibold">Staff:</span> {issue.assignedStaff}</p>
        <p><span className="font-semibold">Status:</span> <StatusBadge status={issue.status} /></p>
      </div>
      <button type="button" onClick={() => issue.backendId ? onBackendResolve(issue) : onResolve(issue)} disabled={isDone || isLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
        {isDone ? 'Already Resolved' : 'Resolve Issue'}
      </button>
    </section>
  );
}

function CustomerFeedback({ issue, feedbackValue, onSubmitFeedback, onClear }) {
  if (!issue || (issue.status !== 'Resolved' && issue.status !== 'Done')) {
    return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Customer Feedback</h2><p className="mt-2 text-sm text-slate-600">Resolve an issue to collect feedback.</p></section>;
  }
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Customer Feedback</h2>
      <p className="mt-2 text-sm text-gray-700">Was issue in room #{issue.roomNumber} fixed correctly?</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onSubmitFeedback('Yes')} className="rounded-lg bg-green-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-400">Yes</button>
        <button type="button" onClick={() => onSubmitFeedback('No')} className="rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-400">No</button>
      </div>
      {feedbackValue && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <p>Feedback: <span className="font-semibold">{feedbackValue}</span></p>
          <button type="button" onClick={onClear} className="mt-2 text-xs font-semibold text-blue-600 transition hover:text-blue-500">Clear</button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MaintenanceDashboard() {
  const { user, logout } = useAuth();
<<<<<<< HEAD
  const { issues, setIssues, refreshIssues } = useIssues();
  const { resolveIssue } = useResolveIssue();
=======
  const { issues, setIssues, addIssueFromBackend } = useIssues();
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e

  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [loadingIssueId, setLoadingIssueId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [feedback, setFeedback] = useState({});

  const selectedIssue = useMemo(() => issues.find((i) => i.id === selectedIssueId) || null, [issues, selectedIssueId]);
  const stats = useMemo(() => ({
    totalAssigned: issues.filter((i) => i.assignedStaff === user.name || i.assignedStaff === 'Abel K.').length,
    resolvedToday: issues.filter((i) => i.status === 'Resolved' || i.status === 'Done').length,
  }), [issues, user.name]);

  // WebSocket: receive Maintenance tasks
  const { connected: wsConnected } = useWebSocket(useCallback((event) => {
    if (event.type === 'new_task' && event.data.category === 'Maintenance') {
      addIssueFromBackend(event.data);
      pushToast(`New maintenance task: Room ${event.data.room_number} — ${event.data.description}`, 'error');
    }
  }, [addIssueFromBackend]));

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleResolveIssue = async (issue) => {
    if (issue.status === 'Resolved' || issue.status === 'Done') { pushToast('Already resolved.', 'error'); return; }
    try {
      setLoadingIssueId(issue.id);
<<<<<<< HEAD
      await resolveIssue(issue.id);
      await apiPost('/api/feedback/task-state', {
        instruction_id: issue.id,
        queue: 'maintenance',
        state: 'Completed',
        is_complete: true,
        staff_note: 'Issue resolved by maintenance team.',
        updated_by: user.name,
      });
      setIssues((previousIssues) =>
        previousIssues.map((currentIssue) => {
          if (currentIssue.id !== issue.id) {
            return currentIssue;
          }

          return {
            ...currentIssue,
            status: 'Resolved',
            assignedStaff: currentIssue.assignedStaff === 'Unassigned' ? user.name : currentIssue.assignedStaff,
          };
        })
      );

      setSelectedIssueId(issue.id);
      await refreshIssues();
      pushToast(`Issue for room ${issue.roomNumber} marked as resolved.`, 'success');
    } catch {
      const message = 'Could not resolve issue. Please try again.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingIssueId('');
    }
=======
      await new Promise((r) => setTimeout(r, 900));
      setIssues((prev) => prev.map((i) => i.id !== issue.id ? i : { ...i, status: 'Resolved', assignedStaff: i.assignedStaff === 'Unassigned' ? user.name : i.assignedStaff }));
      setSelectedIssueId(issue.id);
      pushToast(`Room ${issue.roomNumber} resolved.`, 'success');
    } catch { pushToast('Could not resolve.', 'error'); }
    finally { setLoadingIssueId(''); }
  };

  const handleBackendResolve = async (issue) => {
    if (issue.status === 'Resolved' || issue.status === 'Done') { pushToast('Already resolved.', 'error'); return; }
    try {
      setLoadingIssueId(issue.id);
      await fetch(`${API}/tasks/${issue.backendId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Done' }),
      });
      setIssues((prev) => prev.map((i) => i.id !== issue.id ? i : { ...i, status: 'Done' }));
      setSelectedIssueId(issue.id);
      pushToast(`Room ${issue.roomNumber} marked Done.`, 'success');
    } catch { pushToast('Could not resolve.', 'error'); }
    finally { setLoadingIssueId(''); }
>>>>>>> df4014dc84d564f79ffcbf2eb63f913cab7b628e
  };

  const handleSubmitFeedback = (value) => {
    if (!selectedIssue) return;
    setFeedback((prev) => ({ ...prev, [selectedIssue.id]: value }));
    setIssues((prev) => prev.map((i) => i.id !== selectedIssue.id ? i : { ...i, status: value === 'No' ? 'In Progress' : i.status, customerFeedback: value }));
    pushToast(value === 'Yes' ? 'Confirmed resolution.' : 'Reopened — moved back to In Progress.', value === 'Yes' ? 'success' : 'error');
  };

  const handleLogout = () => { logout?.(); window.location.href = '/login'; };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar user={user} stats={stats} onLogout={handleLogout} wsConnected={wsConnected} />

      {errorMessage && <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{errorMessage}</div>}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Issue Queue</h2>
          <div className="space-y-3">
            {issues.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 px-3 py-5 text-center text-sm text-gray-500">No issues in queue.</div>}
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} selected={selectedIssueId === issue.id} onSelect={(i) => setSelectedIssueId(i.id)} onResolve={handleResolveIssue} onBackendResolve={handleBackendResolve} loadingIssueId={loadingIssueId} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <IssueDetails issue={selectedIssue} onResolve={handleResolveIssue} onBackendResolve={handleBackendResolve} loadingIssueId={loadingIssueId} />
          <CustomerFeedback issue={selectedIssue} feedbackValue={selectedIssue ? feedback[selectedIssue.id] || selectedIssue.customerFeedback : null} onSubmitFeedback={handleSubmitFeedback} onClear={() => { if (selectedIssue) setFeedback((p) => { const n = { ...p }; delete n[selectedIssue.id]; return n; }); }} />
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
