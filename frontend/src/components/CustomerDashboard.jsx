import React, { useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export default function CustomerDashboard() {
  const [requestText, setRequestText] = useState('');
  const [instructionId, setInstructionId] = useState('');
  const [status, setStatus] = useState('');

  const submitRequest = async () => {
    const payload = {
      title: 'Customer request',
      description: requestText,
      category: 'cleaners',
      room: 'N/A',
      priority: 'medium',
    };
    const res = await apiPost('/api/dispatch', payload);
    setInstructionId(String(res.instruction_id || ''));
    setStatus('submitted');
  };

  const checkStatus = async () => {
    if (!instructionId) return;
    const cleaners = await apiGet('/api/feedback/task-state/queue/cleaners');
    const match = (cleaners.items || []).find((i) => String(i.instruction_id) === String(instructionId));
    setStatus(match?.state || 'pending');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="mb-4 text-2xl font-bold">Customer Dashboard</h1>
      <textarea
        value={requestText}
        onChange={(e) => setRequestText(e.target.value)}
        className="w-full rounded-lg border p-3"
        rows={4}
        placeholder="Describe your request"
      />
      <div className="mt-3 flex gap-2">
        <button onClick={submitRequest} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Send Request</button>
        <button onClick={checkStatus} className="rounded-lg border px-4 py-2 text-sm font-semibold">Check Status</button>
      </div>
      <p className="mt-4 text-sm text-slate-700">Instruction: {instructionId || '-'}</p>
      <p className="text-sm text-slate-700">State: {status || '-'}</p>
    </div>
  );
}
