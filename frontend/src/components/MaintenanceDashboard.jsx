import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

const fallbackIssues = [
  { id: 'm-1', room: '208', title: 'Plumbing check', description: 'Sink leaking', status: 'pending' },
];

export default function MaintenanceDashboard() {
  const [issues, setIssues] = useState(fallbackIssues);
  const [loadingId, setLoadingId] = useState('');

  const refresh = async () => {
    try {
      const [inbox, feedback] = await Promise.all([
        apiGet('/api/inbox/maintenance'),
        apiGet('/api/feedback/task-state/queue/maintenance'),
      ]);
      const fMap = new Map((feedback.items || []).map((f) => [f.instruction_id, f.state]));
      const mapped = (inbox.items || []).map((item, i) => ({
        id: item.instruction_id || `m-${i}`,
        room: (item.staff_instruction?.match(/\b\d{2,4}\b/) || ['N/A'])[0],
        title: 'Maintenance task',
        description: item.staff_instruction || '',
        status: fMap.get(item.instruction_id) || 'pending',
      }));
      setIssues(mapped.length ? mapped : fallbackIssues);
    } catch {
      setIssues(fallbackIssues);
    }
  };

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => window.clearInterval(id);
  }, []);

  const resolvedCount = useMemo(() => issues.filter((i) => i.status === 'completed').length, [issues]);

  const resolveIssue = async (issue) => {
    setLoadingId(issue.id);
    try {
      await apiPost('/api/feedback/task-state', {
        instruction_id: String(issue.id),
        queue_name: 'maintenance',
        state: 'completed',
        note: 'Maintenance completed task',
      });
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, status: 'completed' } : i)));
      refresh();
    } finally {
      setLoadingId('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="mb-2 text-2xl font-bold">Maintenance Dashboard</h1>
      <p className="mb-6 text-sm text-slate-600">Resolved today: {resolvedCount}</p>
      <div className="grid gap-3">
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Room {issue.room}</p>
                <p className="text-sm text-slate-600">{issue.description}</p>
              </div>
              <button
                onClick={() => resolveIssue(issue)}
                disabled={loadingId === issue.id || issue.status === 'completed'}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-slate-300"
              >
                {issue.status === 'completed' ? 'Resolved' : loadingId === issue.id ? 'Saving...' : 'Resolve'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
