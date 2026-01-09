import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import MeetingHistory from "../components/MeetingHistory";
import { useAuth } from "../auth/useAuth";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!user) return null;

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    navigate(`/lobby/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-6">
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-20 h-20 rounded-full border border-slate-700"
          />

          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.displayName}</h1>
            <p className="text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className=" flex flex-col mt-12">
          <button onClick={createRoom} className="btn btn-primary btn-lg px-10">
            ➕ Create New Meeting
          </button>
          <button onClick={handleLogout} className="btn btn-error btn-sm">
            Logout
          </button>
          <MeetingHistory userId={user.uid} />
        </div>
      </div>
    </div>
  );
}
