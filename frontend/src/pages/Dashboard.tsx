import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.first_name} {user?.last_name}
            </span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-600">
            Welcome to your project management dashboard! This is where you'll see all your
            projects.
          </p>
          <p className="text-gray-600 mt-2">
            Frontend is connected to the backend API. Next steps: Projects list and Gantt chart!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
