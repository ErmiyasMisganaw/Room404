import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

const AuthContext = createContext({
  user: {
    id: 'CU-9001',
    name: 'Ruth G.',
    roomNumber: '212',
    role: 'Customer',
  },
  logout: () => {},
});

const initialCleaningRequests = [
  {
    id: 'clean-1',
    title: 'Daily room cleaning',
    details: 'Please clean room after 2 PM.',
    status: 'Pending',
    createdAt: '2026-04-03T08:00:00.000Z',
  },
];

const initialMaintenanceRequests = [
  {
    id: 'maint-1',
    title: 'Air conditioner issue',
    details: 'AC is not cooling properly.',
    status: 'In Progress',
    createdAt: '2026-04-03T09:20:00.000Z',
  },
];

const initialCafeteriaOrders = [
  {
    id: 'cafe-1',
    title: 'Lunch order',
    details: 'Pasta x1, Orange Juice x1',
    status: 'Approved',
    createdAt: '2026-04-03T10:10:00.000Z',
  },
];

const initialPayments = [
  {
    id: 'pay-1',
    serviceType: 'Cleaning',
    dateTime: '2026-04-03T08:30:00.000Z',
    cost: 8,
    status: 'Unpaid',
  },
  {
    id: 'pay-2',
    serviceType: 'Maintenance',
    dateTime: '2026-04-03T09:45:00.000Z',
    cost: 12,
    status: 'Paid',
  },
  {
    id: 'pay-3',
    serviceType: 'Cafeteria',
    dateTime: '2026-04-03T10:20:00.000Z',
    cost: 18,
    status: 'Unpaid',
  },
];

function useAuth() {
  return useContext(AuthContext);
}

function useCleaningRequests() {
  const [requests, setRequests] = useState(initialCleaningRequests);

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
}

function useMaintenanceRequests() {
  const [requests, setRequests] = useState(initialMaintenanceRequests);

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
}

function useCafeteriaOrders() {
  const [requests, setRequests] = useState(initialCafeteriaOrders);

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
}

function useNaturalLanguageRequest() {
  const parseRequest = async ({ prompt, room }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    const normalized = prompt.toLowerCase();
    let serviceType = 'cleaning';
    let urgency = 'medium';

    if (normalized.includes('maintenance') || normalized.includes('repair') || normalized.includes('fix')) {
      serviceType = 'maintenance';
    }

    if (normalized.includes('food') || normalized.includes('cafeteria') || normalized.includes('order')) {
      serviceType = 'cafeteria';
    }

    if (normalized.includes('urgent') || normalized.includes('asap') || normalized.includes('immediately')) {
      urgency = 'high';
    }

    return {
      serviceType,
      room,
      details: prompt,
      urgency,
      provider: 'Google Generative AI (placeholder)',
    };
  };

  return { parseRequest };
}

function usePaymentTracker() {
  const [payments] = useState(initialPayments);
  const [loading] = useState(false);

  return {
    payments,
    loading,
  };
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-orange-200 bg-orange-50 text-orange-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs font-semibold text-gray-600 transition hover:text-gray-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ customer, stats, onLogout }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="text-sm text-gray-600">
            {customer.name} • Room #{customer.roomNumber}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatCard label="Total Services Requested" value={stats.totalServicesRequested} />
          <StatCard label="Current Charges" value={`$${stats.currentCharges.toFixed(2)}`} />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500"
        >
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
  const statusClass = {
    Pending: 'border-orange-200 bg-orange-100 text-orange-700',
    'In Progress': 'border-yellow-200 bg-yellow-100 text-yellow-700',
    Completed: 'border-green-200 bg-green-100 text-green-700',
    Approved: 'border-green-200 bg-green-100 text-green-700',
    Rejected: 'border-yellow-200 bg-yellow-100 text-yellow-700',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClass[status] || 'border-gray-200 bg-gray-100 text-gray-700'
      }`}
    >
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

function ServiceRequestPanel({
  serviceKey,
  title,
  placeholder,
  inputValue,
  onInputChange,
  onSubmit,
  requests,
  loading,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(serviceKey);
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
          Submit Request
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold text-gray-800">Existing Requests</p>
        {requests.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
            No requests yet.
          </div>
        )}
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </section>
  );
}

function NaturalLanguageRequestBox({ value, onChange, onSubmit, loading, aiOutput }) {
  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-xl shadow-violet-100">
      <h2 className="text-xl font-bold text-gray-900">Natural Language Request</h2>
      <p className="mt-1 text-sm text-gray-600">
        Describe your request naturally (example: “Urgent maintenance for AC in my room”).
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder="Type your request..."
          className="w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-violet-200" />}
          Parse & Submit
        </button>
      </form>

      {aiOutput && (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
          <p className="font-semibold">AI Parsed Output</p>
          <p className="mt-1">Service: {aiOutput.serviceType}</p>
          <p>Room: {aiOutput.room}</p>
          <p>Urgency: {aiOutput.urgency}</p>
          <p>Details: {aiOutput.details}</p>
        </div>
      )}
    </section>
  );
}

function PaymentTracker({ payments, loading, roomStayCost }) {
  const totalServiceCharges = payments.reduce((sum, payment) => sum + payment.cost, 0);
  const totalCharges = totalServiceCharges + roomStayCost;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900">Payment Tracker</h2>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-blue-200" />
          Loading payment data...
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                <th className="px-3 py-2">Service Type</th>
                <th className="px-3 py-2">Date & Time</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="even:bg-gray-50 hover:bg-blue-50/60">
                  <td className="px-3 py-2 text-gray-800">{payment.serviceType}</td>
                  <td className="px-3 py-2 text-gray-700">{new Date(payment.dateTime).toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-800">${payment.cost.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payment.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            <p>
              <span className="font-semibold">Total Service Charges:</span> ${totalServiceCharges.toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Room Stay Cost:</span> ${roomStayCost.toFixed(2)}
            </p>
            <p className="mt-1 text-base font-bold">Total Charges: ${totalCharges.toFixed(2)}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function CustomerDashboard() {
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
  const { payments, loading: paymentsLoading } = usePaymentTracker();

  const [activeServiceTab, setActiveServiceTab] = useState('cleaning');
  const [serviceInputs, setServiceInputs] = useState({
    cleaning: '',
    maintenance: '',
    cafeteria: '',
  });
  const [nlText, setNlText] = useState('');
  const [aiOutput, setAiOutput] = useState(null);
  const [loadingService, setLoadingService] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [staffUpdates, setStaffUpdates] = useState([]);

  const roomStayCost = 120;

  const stats = useMemo(() => {
    const totalServicesRequested =
      cleaningRequests.length + maintenanceRequests.length + cafeteriaOrders.length;
    const currentCharges = payments.reduce((sum, payment) => sum + payment.cost, 0) + roomStayCost;
    return {
      totalServicesRequested,
      currentCharges,
    };
  }, [cleaningRequests.length, maintenanceRequests.length, cafeteriaOrders.length, payments]);

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

  const updateServiceInput = (key, value) => {
    setServiceInputs((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submitServiceRequest = async (serviceKey, requestText, source = 'manual') => {
    setErrorMessage('');

    if (!requestText.trim()) {
      const message = 'Please provide request details before submitting.';
      setErrorMessage(message);
      pushToast(message, 'error');
      return;
    }

    try {
      setLoadingService(serviceKey);
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
      setActiveServiceTab(serviceKey);
    } catch {
      const message = 'Failed to submit request. Please try again.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingService('');
    }
  };

  const handleNaturalLanguageSubmit = async () => {
    setErrorMessage('');

    if (!nlText.trim()) {
      const message = 'Please type a natural language request first.';
      setErrorMessage(message);
      pushToast(message, 'error');
      return;
    }

    try {
      setLoadingAi(true);
      const parsed = await parseRequest({
        prompt: nlText,
        room: user.roomNumber,
      });

      setAiOutput(parsed);

      await submitServiceRequest(parsed.serviceType, parsed.details, 'ai');
      setNlText('');
      pushToast(`AI request routed to ${parsed.serviceType}.`, 'success');
    } catch {
      const message = 'AI request parsing failed. Please try again.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingAi(false);
    }
  };

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

  const activePanelConfig = {
    cleaning: {
      title: 'Cleaning Requests',
      placeholder: 'Example: Extra towel replacement and floor cleanup.',
      requests: cleaningRequests,
    },
    maintenance: {
      title: 'Maintenance Requests',
      placeholder: 'Example: Water heater is not working in bathroom.',
      requests: maintenanceRequests,
    },
    cafeteria: {
      title: 'Cafeteria Orders',
      placeholder: 'Example: 1 grilled chicken and 2 sparkling waters.',
      requests: cafeteriaOrders,
    },
  };

  const activePanel = activePanelConfig[activeServiceTab];

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
      <Navbar customer={user} stats={stats} onLogout={handleLogout} />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {errorMessage}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex flex-wrap gap-2">
          {serviceTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveServiceTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeServiceTab === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
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
            onInputChange={(value) => updateServiceInput(activeServiceTab, value)}
            onSubmit={(serviceKey) => submitServiceRequest(serviceKey, serviceInputs[serviceKey], 'manual')}
            requests={activePanel.requests}
            loading={loadingService === activeServiceTab}
          />

          <NaturalLanguageRequestBox
            value={nlText}
            onChange={setNlText}
            onSubmit={handleNaturalLanguageSubmit}
            loading={loadingAi}
            aiOutput={aiOutput}
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