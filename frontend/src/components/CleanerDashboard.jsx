import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: {
    id: 'CL-104',
    name: 'Sami T.',
    role: 'Cleaner',
    currentStatus: 'Available',
  },
  logout: () => {},
});

const initialAssignedTasks = [
  {
    id: 'task-1',
    roomNumber: '302',
    etaMinutes: 20,
    status: 'In Progress',
    assignedCleaners: ['Sami T.'],
  },
  {
    id: 'task-2',
    roomNumber: '115',
    etaMinutes: 35,
    status: 'Pending',
    assignedCleaners: ['Sami T.', 'Helen R.'],
  },
];

const initialAvailableRooms = [
  {
    id: 'queue-1',
    roomNumber: '210',
    etaMinutes: 25,
    status: 'Pending',
    assignedCleaners: [],
  },
  {
    id: 'queue-2',
    roomNumber: '407',
    etaMinutes: 40,
    status: 'Pending',
    assignedCleaners: ['Jon P.'],
  },
  {
    id: 'queue-3',
    roomNumber: '126',
    etaMinutes: 15,
    status: 'Pending',
    assignedCleaners: [],
  },
];

function useAuth() {
  return useContext(AuthContext);
}

function useCooldown(initialSeconds = 90) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [remainingSeconds]);

  const startCooldown = (durationSeconds = initialSeconds) => {
    setRemainingSeconds(durationSeconds);
  };

  return {
    remainingSeconds,
    isCoolingDown: remainingSeconds > 0,
    startCooldown,
  };
}

function useTasks(cleanerName) {
  const [assignedTasks, setAssignedTasks] = useState(initialAssignedTasks);
  const [availableRooms, setAvailableRooms] = useState(initialAvailableRooms);

  useEffect(() => {
    const tickId = window.setInterval(() => {
      setAssignedTasks((previousTasks) =>
        previousTasks.map((task) => ({
          ...task,
          etaMinutes: task.status === 'Completed' ? task.etaMinutes : Math.max(task.etaMinutes - 1, 0),
        }))
      );

      setAvailableRooms((previousRooms) =>
        previousRooms.map((room) => ({
          ...room,
          etaMinutes: Math.max(room.etaMinutes - 1, 0),
        }))
      );
    }, 6000);

    const queueId = window.setInterval(() => {
      setAvailableRooms((previousRooms) => {
        if (previousRooms.length > 8) {
          return previousRooms;
        }

        const roomSuffix = Math.floor(100 + Math.random() * 400).toString();
        const nextRoom = {
          id: `queue-${Date.now()}-${Math.floor(Math.random() * 99)}`,
          roomNumber: roomSuffix,
          etaMinutes: 15 + Math.floor(Math.random() * 30),
          status: 'Pending',
          assignedCleaners: Math.random() > 0.5 ? ['Mina S.'] : [],
        };

        return [...previousRooms, nextRoom];
      });
    }, 22000);

    return () => {
      window.clearInterval(tickId);
      window.clearInterval(queueId);
    };
  }, []);

  const takeTask = ({ queueTaskId }) => {
    setAvailableRooms((previousRooms) => {
      const selectedRoom = previousRooms.find((room) => room.id === queueTaskId);

      if (!selectedRoom) {
        return previousRooms;
      }

      setAssignedTasks((previousTasks) => [
        ...previousTasks,
        {
          id: `task-${selectedRoom.id}`,
          roomNumber: selectedRoom.roomNumber,
          etaMinutes: selectedRoom.etaMinutes,
          status: 'Pending',
          assignedCleaners: [...selectedRoom.assignedCleaners, cleanerName],
        },
      ]);

      return previousRooms.filter((room) => room.id !== queueTaskId);
    });
  };

  const updateTaskStatus = ({ taskId, nextStatus }) => {
    setAssignedTasks((previousTasks) =>
      previousTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        return {
          ...task,
          status: nextStatus,
        };
      })
    );
  };

  return {
    assignedTasks,
    availableRooms,
    takeTask,
    updateTaskStatus,
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

function Navbar({ cleaner, stats, onLogout }) {
  return (
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cleaner Dashboard</h1>
          <p className="text-sm text-slate-600">
            {cleaner.name} • {cleaner.role}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatCard label="Total Tasks Assigned" value={stats.totalAssigned} />
          <StatCard label="Completed Today" value={stats.completedToday} />
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

function ProfileSection({ cleaner, activeTaskCount }) {
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-slate-900">Cleaner Profile</h2>
      <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <p>
          <span className="font-semibold">Name:</span> {cleaner.name}
        </p>
        <p>
          <span className="font-semibold">ID:</span> {cleaner.id}
        </p>
        <p>
          <span className="font-semibold">Current Status:</span>{' '}
          {activeTaskCount > 0 ? 'Busy' : cleaner.currentStatus}
        </p>
      </div>
    </section>
  );
}

function CooldownTimer({ remainingSeconds, isCoolingDown }) {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Task Cooldown</h2>
      <p
        className={`mt-2 text-2xl font-bold ${
          isCoolingDown ? 'text-amber-600' : 'text-emerald-600'
        }`}
      >
        {isCoolingDown ? `${minutes}:${seconds}` : 'Ready'}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {isCoolingDown
          ? 'Please wait until cooldown ends before taking or confirming new work.'
          : 'You can take or confirm tasks now.'}
      </p>
    </section>
  );
}

function StatusBadge({ status }) {
  const statusClasses = {
    Completed: 'border-green-200 bg-green-100 text-green-800',
    'In Progress': 'border-yellow-200 bg-yellow-100 text-yellow-800',
    Pending: 'border-red-200 bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        statusClasses[status] || 'border-slate-200 bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function TaskCard({ task, isConfirmDisabled, onConfirm, loadingTaskId }) {
  const isLoading = loadingTaskId === task.id;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Room</p>
          <p className="text-lg font-semibold text-slate-900">#{task.roomNumber}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold">ETA:</span> {task.etaMinutes} min
        </p>
        <p>
          <span className="font-semibold">Assigned Cleaner(s):</span>{' '}
          {task.assignedCleaners.length > 0 ? task.assignedCleaners.join(', ') : 'Not Assigned'}
        </p>
      </div>

      <button
        type="button"
        disabled={isConfirmDisabled || task.status === 'Completed' || isLoading}
        onClick={() => onConfirm(task)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {task.status === 'Completed' ? 'Task Completed' : 'Confirm Task'}
      </button>
    </article>
  );
}

function AvailableRoomsList({
  rooms,
  selectedTaskId,
  onSelect,
  onTakeTask,
  disabled,
  loadingTaskId,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Available Rooms Queue</h2>

      <div className="space-y-3">
        {rooms.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
            No rooms waiting for cleaning.
          </div>
        )}

        {rooms.map((room) => {
          const isSelected = selectedTaskId === room.id;
          const isLoading = loadingTaskId === room.id;

          return (
            <article
              key={room.id}
              className={`rounded-lg border p-4 transition ${
                isSelected
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Room</p>
                  <p className="text-lg font-semibold text-slate-900">#{room.roomNumber}</p>
                </div>
                <StatusBadge status={room.status} />
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">ETA:</span> {room.etaMinutes} min
                </p>
                <p>
                  <span className="font-semibold">Other Assigned:</span>{' '}
                  {room.assignedCleaners.length > 0 ? room.assignedCleaners.join(', ') : 'None'}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onSelect(room.id)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
                <button
                  type="button"
                  disabled={disabled || isLoading}
                  onClick={() => onTakeTask(room.id)}
                  className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Assign to Me
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function CleanerDashboard() {
  const { user, logout } = useAuth();
  const { assignedTasks, availableRooms, takeTask, updateTaskStatus } = useTasks(user.name);
  const { remainingSeconds, isCoolingDown, startCooldown } = useCooldown(90);

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loadingTaskId, setLoadingTaskId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  const completedToday = useMemo(
    () => assignedTasks.filter((task) => task.status === 'Completed').length,
    [assignedTasks]
  );

  const stats = useMemo(
    () => ({
      totalAssigned: assignedTasks.length,
      completedToday,
    }),
    [assignedTasks.length, completedToday]
  );

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((previous) => [...previous, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3400);
  };

  const dismissToast = (id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const handleTakeTask = async (queueTaskId) => {
    setErrorMessage('');

    if (isCoolingDown) {
      const message = 'Cooldown active. Wait before taking a new task.';
      setErrorMessage(message);
      pushToast(message, 'error');
      return;
    }

    try {
      setLoadingTaskId(queueTaskId);
      await new Promise((resolve) => {
        setTimeout(resolve, 850);
      });
      takeTask({ queueTaskId });
      setSelectedTaskId('');
      pushToast('Task assigned to you successfully.', 'success');
    } catch {
      const message = 'Failed to assign task. Please retry.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingTaskId('');
    }
  };

  const handleConfirmTask = async (task) => {
    setErrorMessage('');

    if (isCoolingDown) {
      const message = 'Confirm button is disabled during cooldown.';
      setErrorMessage(message);
      pushToast(message, 'error');
      return;
    }

    try {
      setLoadingTaskId(task.id);
      await new Promise((resolve) => {
        setTimeout(resolve, 900);
      });

      if (task.status === 'Pending') {
        updateTaskStatus({ taskId: task.id, nextStatus: 'In Progress' });
        pushToast(`Room ${task.roomNumber} moved to In Progress.`, 'success');
      } else if (task.status === 'In Progress') {
        updateTaskStatus({ taskId: task.id, nextStatus: 'Completed' });
        startCooldown(90);
        pushToast(`Room ${task.roomNumber} completed. Cooldown started.`, 'success');
      }
    } catch {
      const message = 'Could not confirm task. Try again.';
      setErrorMessage(message);
      pushToast(message, 'error');
    } finally {
      setLoadingTaskId('');
    }
  };

  const handleLogout = () => {
    logout?.();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <Navbar cleaner={user} stats={stats} onLogout={handleLogout} />

      <ProfileSection
        cleaner={user}
        activeTaskCount={assignedTasks.filter((task) => task.status !== 'Completed').length}
      />

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AvailableRoomsList
          rooms={availableRooms}
          selectedTaskId={selectedTaskId}
          onSelect={setSelectedTaskId}
          onTakeTask={handleTakeTask}
          disabled={isCoolingDown}
          loadingTaskId={loadingTaskId}
        />

        <section className="space-y-4">
          <CooldownTimer remainingSeconds={remainingSeconds} isCoolingDown={isCoolingDown} />

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Assigned Tasks</h2>
            <div className="space-y-3">
              {assignedTasks.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                  No tasks assigned yet.
                </div>
              )}

              {assignedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isConfirmDisabled={isCoolingDown}
                  onConfirm={handleConfirmTask}
                  loadingTaskId={loadingTaskId}
                />
              ))}
            </div>
          </section>
        </section>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}