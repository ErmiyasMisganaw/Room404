import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: {
    id: 'MT-220',
    name: 'Abel K.',
    role: 'Maintenance Staff',
  },
  logout: () => {},
});

const initialIssues = [
  {
    id: 'issue-1',
    roomNumber: '208',
    issueType: 'Plumbing',
    description: 'Bathroom sink leaking under cabinet.',
    reportedBy: 'Saron D.',
    status: 'Pending',
    assignedStaff: 'Abel K.',
    customerFeedback: null,
  },
  {
    id: 'issue-2',
    roomNumber: '315',
    issueType: 'Electricity',
    description: 'Main lights flicker intermittently.',
    reportedBy: 'Noah M.',
    status: 'In Progress',
    assignedStaff: 'Abel K.',
    customerFeedback: null,
  },
  {
    id: 'issue-3',
    roomNumber: '109',
    issueType: 'HVAC',
    description: 'AC not cooling the room.',
    reportedBy: 'Mimi T.',
    status: 'Resolved',
    assignedStaff: 'Abel K.',
    customerFeedback: 'Yes',
  },
];

function useAuth() {
  return useContext(AuthContext);
}

function useIssues() {
  const [issues, setIssues] = useState(initialIssues);

  useEffect(() => {
    const refreshId = window.setInterval(() => {
      setIssues((previousIssues) => {
        if (previousIssues.length > 10) {
          return previousIssues;
        }

        if (Math.random() < 0.65) {
          return previousIssues;
        }

        const roomNumber = String(100 + Math.floor(Math.random() * 350));
        const issueTypes = ['Plumbing', 'Electricity', 'Furniture', 'HVAC', 'Internet'];
        const descriptions = [
          'Reported unusual noise from fixture.',
          'Device outlet not functioning.',
          'Guest reports issue with door lock.',
          'Temperature control not responding.',
          'Intermittent network connectivity issue.',
        ];

        const index = Math.floor(Math.random() * issueTypes.length);

        const newIssue = {
          id: `issue-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          roomNumber,
          issueType: issueTypes[index],
          description: descriptions[index],
          reportedBy: 'New Customer',
          status: 'Pending',
          assignedStaff: 'Unassigned',
          customerFeedback: null,
        };

        return [newIssue, ...previousIssues];
      });
    }, 20000);

    return () => {
      window.clearInterval(refreshId);
    };
  }, []);

  return { issues, setIssues };
}

function useResolveIssue() {
  const resolveIssue = async (issueId) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    return { issueId, resolvedAt: new Date().toISOString() };
  };

  return { resolveIssue };
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs font-semibold opacity-75 transition hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ user, stats, onLogout }) {
  return (
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance Dashboard</h1>
          <p className="text-sm text-slate-600">
            {user.name} • {user.role}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatCard label="Total Issues Assigned" value={stats.totalAssigned} />
          <StatCard label="Resolved Today" value={stats.resolvedToday} />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-md bg-slate-100 px-3 py-2 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClass = {
    Pending: 'border-red-200 bg-red-100 text-red-800',
    'In Progress': 'border-yellow-200 bg-yellow-100 text-yellow-800',
    Resolved: 'border-green-200 bg-green-100 text-green-800',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClass[status] || 'border-slate-200 bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function IssueCard({ issue, selected, onSelect, onResolve, loadingIssueId }) {
  const isLoading = loadingIssueId === issue.id;

  return (
    <article
      className={`rounded-lg border p-4 shadow-sm transition ${
        selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Room</p>
          <p className="text-lg font-semibold text-slate-900">#{issue.roomNumber}</p>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Issue Type:</span> {issue.issueType}
        </p>
        <p>
          <span className="font-semibold">Reported By:</span> {issue.reportedBy}
        </p>
        <p>
          <span className="font-semibold">Assigned Staff:</span> {issue.assignedStaff}
        </p>
      </div>

      <p className="mt-3 text-sm text-slate-700">{issue.description}</p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect(issue)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {selected ? 'Selected' : 'View Details'}
        </button>
        <button
          type="button"
          onClick={() => onResolve(issue)}
          disabled={issue.status === 'Resolved' || isLoading}
          className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {issue.status === 'Resolved' ? 'Resolved' : 'Resolve Issue'}
        </button>
      </div>
    </article>
  );
}

function IssueDetails({ issue, onResolve, loadingIssueId }) {
  if (!issue) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Issue Details</h2>
        <p className="mt-2 text-sm text-slate-600">Select an issue from the queue to view full details.</p>
      </section>
    );
  }

  const isLoading = loadingIssueId === issue.id;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Issue Details</h2>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Room Number:</span> #{issue.roomNumber}
        </p>
        <p>
          <span className="font-semibold">Issue Type:</span> {issue.issueType}
        </p>
        <p>
          <span className="font-semibold">Description:</span> {issue.description}
        </p>
        <p>
          <span className="font-semibold">Reported By:</span> {issue.reportedBy}
        </p>
        <p>
          <span className="font-semibold">Assigned Staff:</span> {issue.assignedStaff}
        </p>
        <p>
          <span className="font-semibold">Status:</span> <StatusBadge status={issue.status} />
        </p>
      </div>

      <button
        type="button"
        onClick={() => onResolve(issue)}
        disabled={issue.status === 'Resolved' || isLoading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {issue.status === 'Resolved' ? 'Issue Already Resolved' : 'Resolve Issue'}
      </button>
    </section>
  );
}

function CustomerFeedback({ issue, feedbackValue, onSubmitFeedback, onClear }) {
  if (!issue || issue.status !== 'Resolved') {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Customer Feedback</h2>
        <p className="mt-2 text-sm text-slate-600">
          Resolve an issue to collect customer feedback.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Customer Feedback</h2>
      <p className="mt-2 text-sm text-slate-700">
        Was issue in room #{issue.roomNumber} fixed correctly?
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSubmitFeedback('Yes')}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onSubmitFeedback('No')}
          className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          No
        </button>
      </div>

      {feedbackValue && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p>
            Latest Feedback: <span className="font-semibold">{feedbackValue}</span>
          </p>
          <button
            type="button"
            onClick={onClear}
            className="mt-2 text-xs font-semibold text-blue-700 transition hover:text-blue-600"
          >
            Clear Feedback Selection
          </button>
        </div>
      )}
    </section>
  );
}

export default function MaintenanceDashboard() {
  const { user, logout } = useAuth();
  const { issues, setIssues } = useIssues();
  const { resolveIssue } = useResolveIssue();

  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [loadingIssueId, setLoadingIssueId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [feedback, setFeedback] = useState({});

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === selectedIssueId) || null,
    [issues, selectedIssueId]
  );

  const stats = useMemo(() => {
    const totalAssigned = issues.filter((issue) => issue.assignedStaff === user.name).length;
    const resolvedToday = issues.filter((issue) => issue.status === 'Resolved').length;
    return { totalAssigned, resolvedToday };
  }, [issues, user.name]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((previous) => [...previous, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const handleResolveIssue = async (issue) => {
    setErrorMessage('');

    if (issue.status === 'Resolved') {
      const message = 'Issue is already resolved.';
      setErrorMessage(message);
      pushToast(message, 'error');
      return;
    }

    try {
      setLoadingIssueId(issue.id);
      await resolveIssue(issue.id);
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
      pushToast(`Issue for room ${issue.roomNumber} marked as resolved.`, 'success');
    } catch {
      const message = 'Could not resolve issue. Please try again.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingIssueId('');
    }
  };

  const handleSubmitFeedback = (value) => {
    if (!selectedIssue) {
      return;
    }

    setFeedback((previous) => ({
      ...previous,
      [selectedIssue.id]: value,
    }));

    setIssues((previousIssues) =>
      previousIssues.map((issue) => {
        if (issue.id !== selectedIssue.id) {
          return issue;
        }

        if (value === 'No') {
          return {
            ...issue,
            status: 'In Progress',
            customerFeedback: value,
          };
        }

        return {
          ...issue,
          status: 'Resolved',
          customerFeedback: value,
        };
      })
    );

    if (value === 'Yes') {
      pushToast('Customer confirmed issue resolution.', 'success');
    } else {
      pushToast('Customer reported issue still open. Moved back to In Progress.', 'error');
    }
  };

  const handleClearFeedback = () => {
    if (!selectedIssue) {
      return;
    }

    setFeedback((previous) => {
      const nextFeedback = { ...previous };
      delete nextFeedback[selectedIssue.id];
      return nextFeedback;
    });
  };

  const handleLogout = () => {
    logout?.();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <Navbar user={user} stats={stats} onLogout={handleLogout} />

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Issue Queue</h2>
          <div className="space-y-3">
            {issues.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                No issues currently in the queue.
              </div>
            )}

            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                selected={selectedIssueId === issue.id}
                onSelect={(currentIssue) => setSelectedIssueId(currentIssue.id)}
                onResolve={handleResolveIssue}
                loadingIssueId={loadingIssueId}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <IssueDetails
            issue={selectedIssue}
            onResolve={handleResolveIssue}
            loadingIssueId={loadingIssueId}
          />

          <CustomerFeedback
            issue={selectedIssue}
            feedbackValue={selectedIssue ? feedback[selectedIssue.id] || selectedIssue.customerFeedback : null}
            onSubmitFeedback={handleSubmitFeedback}
            onClear={handleClearFeedback}
          />
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}