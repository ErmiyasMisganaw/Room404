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
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              className="text-xs font-semibold text-gray-600 transition hover:text-gray-900"
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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="text-sm text-gray-600">
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
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

function RoomAssignmentForm({ formState, onChange, onSubmit, loading, errorMessage, assignmentResult }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg transition hover:shadow-xl">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Room Assignment</h2>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Customer Name</label>
          <input
            type="text"
            name="customerName"
            value={formState.customerName}
            onChange={onChange}
            required
            placeholder="Enter full name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Check-in Date</label>
            <input
              type="date"
              name="checkInDate"
              value={formState.checkInDate}
              onChange={onChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Check-out Date</label>
            <input
              type="date"
              name="checkOutDate"
              value={formState.checkOutDate}
              onChange={onChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">Room Type</label>
          <select
            name="roomType"
            value={formState.roomType}
            onChange={onChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
          </select>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-200" />}
          {loading ? 'Assigning Room...' : 'Assign Room & Generate Credentials'}
        </button>
      </form>

      {assignmentResult && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 shadow-sm">
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
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg transition hover:shadow-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Room Lookup</h2>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Search Room #</label>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="e.g. 201"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Filter Type</label>
            <select
              value={selectedRoomType}
              onChange={(event) => onTypeFilterChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <th className="px-3 py-2">Room Number</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Assigned Customer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                  No rooms match your filters.
                </td>
              </tr>
            )}

            {rooms.map((room) => (
              <tr key={room.roomNumber} className="even:bg-gray-50 hover:bg-blue-50/60">
                <td className="px-3 py-2 font-medium text-gray-900">{room.roomNumber}</td>
                <td className="px-3 py-2 text-gray-700">{room.type}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={room.status} />
                </td>
                <td className="px-3 py-2 text-gray-700">{room.assignedCustomer || '-'}</td>
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
    Available: 'bg-green-100 text-green-700 border-green-200',
    Occupied: 'bg-orange-100 text-orange-700 border-orange-200',
    'Cleaning Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] || 'bg-gray-100 text-gray-700 border-gray-200'
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
    <div className="min-h-screen bg-gray-50 px-4 pb-6 pt-28 font-sans md:px-6">
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
