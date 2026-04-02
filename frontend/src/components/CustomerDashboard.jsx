import React, { createContext, useContext, useMemo, useState } from 'react';

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

  const createRequest = async ({ title, details }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    const nextRequest = {
      id: `clean-${Date.now()}`,
      title,
      details,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((previous) => [nextRequest, ...previous]);
    return nextRequest;
  };

  return { requests, createRequest };
}

function useMaintenanceRequests() {
  const [requests, setRequests] = useState(initialMaintenanceRequests);

  const createRequest = async ({ title, details }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 750);
    });

    const nextRequest = {
      id: `maint-${Date.now()}`,
      title,
      details,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((previous) => [nextRequest, ...previous]);
    return nextRequest;
  };

  return { requests, createRequest };
}

function useCafeteriaOrders() {
  const [requests, setRequests] = useState(initialCafeteriaOrders);

  const createRequest = async ({ title, details }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });

    const nextRequest = {
      id: `cafe-${Date.now()}`,
      title,
      details,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setRequests((previous) => [nextRequest, ...previous]);
    return nextRequest;
  };

  return { requests, createRequest };
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

function Navbar({ customer, stats, onLogout }) {
  return (
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Dashboard</h1>
          <p className="text-sm text-slate-600">
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
    Completed: 'border-green-200 bg-green-100 text-green-800',
    Approved: 'border-green-200 bg-green-100 text-green-800',
    Rejected: 'border-yellow-200 bg-yellow-100 text-yellow-800',
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

function RequestCard({ request }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{request.title}</p>
        <StatusBadge status={request.status} />
      </div>
      <p className="mt-2 text-sm text-slate-700">{request.details}</p>
      <p className="mt-2 text-xs text-slate-500">{new Date(request.createdAt).toLocaleString()}</p>
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          Submit Request
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold text-slate-800">Existing Requests</p>
        {requests.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Natural Language Request</h2>
      <p className="mt-1 text-sm text-slate-600">
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          Parse & Submit
        </button>
      </form>

      {aiOutput && (
        <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Payment Tracker</h2>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
          Loading payment data...
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Service Type</th>
                <th className="px-3 py-2">Date & Time</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-3 py-2 text-slate-800">{payment.serviceType}</td>
                  <td className="px-3 py-2 text-slate-700">{new Date(payment.dateTime).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-800">${payment.cost.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payment.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-800">
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
  const { requests: cleaningRequests, createRequest: createCleaningRequest } = useCleaningRequests();
  const { requests: maintenanceRequests, createRequest: createMaintenanceRequest } = useMaintenanceRequests();
  const { requests: cafeteriaOrders, createRequest: createCafeteriaOrder } = useCafeteriaOrders();
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

      if (serviceKey === 'cleaning') {
        await createCleaningRequest(payload);
      } else if (serviceKey === 'maintenance') {
        await createMaintenanceRequest(payload);
      } else {
        await createCafeteriaOrder(payload);
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <Navbar customer={user} stats={stats} onLogout={handleLogout} />

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {serviceTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveServiceTab(tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                activeServiceTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}