import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../firestore";

export default function MeetingHistory({ userId }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const q = query(
          collection(db, "meetings"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMeetings(data);
      } catch (err) {
        console.error("Failed to fetch meetings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [userId]);

  if (loading) {
    return <div className="mt-12 text-slate-400">Loading history…</div>;
  }

  if (meetings.length === 0) {
    return <div className="mt-12 text-slate-400">No meetings yet.</div>;
  }

  return (
    <div className="mt-16">
      <h2 className="text-xl text-center text-black font-semibold mb-6">Meeting History</h2>

      <div className="rounded-2xl border border-slate-950 h-[40vh] overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-[#080123] text-slate-300 text-sm">
            <tr>
              <th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Duration</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((m) => {
              const date = m.startedAt.toDate();

              return (
                <tr
                  key={m.id}
                  className="border-t border-slate-800 bg-slate-800/55 hover:bg-slate-800/90"
                >
                  <td className="px-6 py-4 font-mono text-indigo-400">
                    {m.roomId}
                  </td>
                  <td className="px-6 py-4">
                    {date.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {m.duration} min
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
