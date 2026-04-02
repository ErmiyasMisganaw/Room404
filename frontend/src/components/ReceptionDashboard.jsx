import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: {
    name: 'Front Desk Agent',
    role: 'Receptionist',
  },
  logout: () => {},
});

const initialRooms = [
  { roomNumber: '101', type: 'Single', status: 'Available', assignedCustomer: '-' },
  { roomNumber: '102', type: 'Single', status: 'Occupied', assignedCustomer: 'Marta B.' },
  { roomNumber: '103', type: 'Single', status: 'Cleaning Pending', assignedCustomer: '-' },
  { roomNumber: '201', type: 'Double', status: 'Available', assignedCustomer: '-' },
  { roomNumber: '202', type: 'Double', status: 'Occupied', assignedCustomer: 'Daniel K.' },
  { roomNumber: '203', type: 'Double', status: 'Available', assignedCustomer: '-' },
  { roomNumber: '301', type: 'Suite', status: 'Cleaning Pending', assignedCustomer: '-' },
  { roomNumber: '302', type: 'Suite', status: 'Available', assignedCustomer: '-' },
  { roomNumber: '303', type: 'Suite', status: 'Occupied', assignedCustomer: 'Aster M.' },
];

function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

function useRooms() {
  const [rooms, setRooms] = useState(initialRooms);

  const assignRoom = ({ roomNumber, customerName }) => {
    setRooms((previousRooms) =>
      previousRooms.map((room) => {
        if (room.roomNumber !== roomNumber) {
          return room;
        }

        return {
          ...room,
          status: 'Occupied',
          assignedCustomer: customerName,
        };
      })
    );
  };

  return {
    rooms,
    assignRoom,
  };
}

function useCustomerRegistration() {
  const registerCustomer = async ({ customerName, checkInDate, checkOutDate, roomNumber }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    const username = customerName.trim().toLowerCase().replace(/\s+/g, '.') + roomNumber;
    const password = Math.random().toString(36).slice(-10);

    return {
      username,
      password,
      customerName,
      checkInDate,
      checkOutDate,
      roomNumber,
    };
  };

  return { registerCustomer };
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
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              className="text-xs font-semibold opacity-70 transition hover:opacity-100"
              onClick={() => onDismiss(toast.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Navbar({ receptionist, roomStats, onLogout }) {
  return (
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reception Dashboard</h1>
          <p className="text-sm text-slate-600">
            {receptionist?.name} • {receptionist?.role}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatCard label="Total Rooms" value={roomStats.totalRooms} />
          <StatCard label="Available" value={roomStats.availableRooms} />
          <StatCard label="Occupied" value={roomStats.occupiedRooms} />
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

function RoomAssignmentForm({ formState, onChange, onSubmit, loading, errorMessage, assignmentResult }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Room Assignment</h2>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
          <input
            type="text"
            name="customerName"
            value={formState.customerName}
            onChange={onChange}
            required
            placeholder="Enter full name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Check-in Date</label>
            <input
              type="date"
              name="checkInDate"
              value={formState.checkInDate}
              onChange={onChange}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Check-out Date</label>
            <input
              type="date"
              name="checkOutDate"
              value={formState.checkOutDate}
              onChange={onChange}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Room Type</label>
          <select
            name="roomType"
            value={formState.roomType}
            onChange={onChange}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
          >
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
          </select>
        </div>

        {errorMessage && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {loading ? 'Assigning Room...' : 'Assign Room & Generate Credentials'}
        </button>
      </form>

      {assignmentResult && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Room Assigned Successfully</p>
          <p className="mt-1">Room Number: {assignmentResult.roomNumber}</p>
          <p>Username: {assignmentResult.username}</p>
          <p>Password: {assignmentResult.password}</p>
        </div>
      )}
    </section>
  );
}

function RoomTable({ rooms, searchValue, onSearchChange, selectedRoomType, onTypeFilterChange }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Room Lookup</h2>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-600">Search Room #</label>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="e.g. 201"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-600">Filter Type</label>
            <select
              value={selectedRoomType}
              onChange={(event) => onTypeFilterChange(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
            >
              <option value="All">All</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="px-3 py-2">Room Number</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Assigned Customer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                  No rooms match your filters.
                </td>
              </tr>
            )}

            {rooms.map((room) => (
              <tr key={room.roomNumber} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-900">{room.roomNumber}</td>
                <td className="px-3 py-2 text-slate-700">{room.type}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={room.status} />
                </td>
                <td className="px-3 py-2 text-slate-700">{room.assignedCustomer || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const statusClasses = {
    Available: 'bg-green-100 text-green-800 border-green-200',
    Occupied: 'bg-red-100 text-red-800 border-red-200',
    'Cleaning Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
}

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const { rooms, assignRoom } = useRooms();
  const { registerCustomer } = useCustomerRegistration();

  const [formState, setFormState] = useState({
    customerName: '',
    checkInDate: '',
    checkOutDate: '',
    roomType: 'Single',
  });
  const [searchValue, setSearchValue] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [toasts, setToasts] = useState([]);

  const roomStats = useMemo(() => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((room) => room.status === 'Available').length;
    const occupiedRooms = rooms.filter((room) => room.status === 'Occupied').length;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesRoomNumber = room.roomNumber.toLowerCase().includes(normalizedSearch);
      const matchesType = selectedRoomType === 'All' || room.type === selectedRoomType;
      return matchesRoomNumber && matchesType;
    });
  }, [rooms, searchValue, selectedRoomType]);

  const pushToast = (message, type = 'success') => {
    const toastId = Date.now() + Math.floor(Math.random() * 999);
    const nextToast = { id: toastId, message, type };
    setToasts((previousToasts) => [...previousToasts, nextToast]);

    setTimeout(() => {
      setToasts((previousToasts) => previousToasts.filter((toast) => toast.id !== toastId));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((previousToasts) => previousToasts.filter((toast) => toast.id !== id));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((previousState) => ({
      ...previousState,
      [name]: value,
    }));
  };

  const handleAssignRoom = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setAssignmentResult(null);

    if (!formState.customerName.trim()) {
      setErrorMessage('Customer name is required.');
      pushToast('Customer name is required.', 'error');
      return;
    }

    const availableRoom = rooms.find(
      (room) => room.status === 'Available' && room.type === formState.roomType
    );

    if (!availableRoom) {
      const errorText = `No ${formState.roomType} room is currently available.`;
      setErrorMessage(errorText);
      pushToast(errorText, 'error');
      return;
    }

    try {
      setLoading(true);

      const registrationResult = await registerCustomer({
        customerName: formState.customerName,
        checkInDate: formState.checkInDate,
        checkOutDate: formState.checkOutDate,
        roomNumber: availableRoom.roomNumber,
      });

      assignRoom({
        roomNumber: availableRoom.roomNumber,
        customerName: formState.customerName,
      });

      setAssignmentResult({
        roomNumber: availableRoom.roomNumber,
        username: registrationResult.username,
        password: registrationResult.password,
      });

      setFormState((previousState) => ({
        ...previousState,
        customerName: '',
      }));

      pushToast(`Room ${availableRoom.roomNumber} assigned successfully.`, 'success');
    } catch {
      const errorText = 'Assignment failed. Please try again.';
      setErrorMessage(errorText);
      pushToast(errorText, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout?.();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <Navbar receptionist={user} roomStats={roomStats} onLogout={handleLogout} />

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RoomAssignmentForm
          formState={formState}
          onChange={handleInputChange}
          onSubmit={handleAssignRoom}
          loading={loading}
          errorMessage={errorMessage}
          assignmentResult={assignmentResult}
        />

        <RoomTable
          rooms={filteredRooms}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedRoomType={selectedRoomType}
          onTypeFilterChange={setSelectedRoomType}
        />
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
