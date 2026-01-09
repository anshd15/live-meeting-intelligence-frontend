import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useWebRTC } from "./useWebRTC";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import socket from "../../socket/socket";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firestore";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [isHost, setIsHost] = useState(false);
  const [requests, setRequests] = useState([]);
  const [peerUser, setPeerUser] = useState(null);

  const meetingStartedAtRef = useRef(new Date());
  const meetingSavedRef = useRef(false);

  // 🔒 Auth guard
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  // 🧑‍💼 Host + join request listeners
  useEffect(() => {
    const onHost = () => setIsHost(true);

    const onJoinRequest = (req) => {
      setRequests((prev) => [...prev, req]);
    };

    const onPeerJoined = (peer) => {
      setPeerUser(peer); // 🔥 store other participant
    };

    socket.on("host", onHost);
    socket.on("join-request", onJoinRequest);
    socket.on("peer-joined", onPeerJoined);

    return () => {
      socket.off("host", onHost);
      socket.off("join-request", onJoinRequest);
      socket.off("peer-joined", onPeerJoined);
    };
  }, []);

  // 🎥 WebRTC
  const {
    localVideoRef,
    remoteVideoRef,
    status,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    cleanup,
  } = useWebRTC(roomId, user);

  // 🧾 Save meeting history (ONCE)
  const saveMeeting = async () => {
    if (!user || meetingSavedRef.current) return;

    meetingSavedRef.current = true;

    const endedAt = new Date();
    const startedAt = meetingStartedAtRef.current;

    const duration = Math.max(
      1,
      Math.round((endedAt - startedAt) / 60000)
    );

    try {
      await addDoc(collection(db, "meetings"), {
        userId: user.uid,
        peerId: peerUser?.uid || null,
        peerName: peerUser?.displayName || "Unknown",
        roomId,
        startedAt,
        endedAt,
        duration,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to save meeting:", err);
    }
  };

  // 🧹 Cleanup on leave / refresh / tab close
  useEffect(() => {
    return () => {
      saveMeeting();
      cleanup();
    };
  }, []);

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Connecting…
      </div>
    );
  }

  const leave = async () => {
    await saveMeeting();
    cleanup();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
      <h2 className="mb-2">Room: {roomId}</h2>
      <p className="mb-4">ICE state: {status}</p>

      <VideoGrid localRef={localVideoRef} remoteRef={remoteVideoRef} />

      {/* 👮 Host approval UI */}
      {isHost && requests.length > 0 && (
        <div className="mt-6 bg-slate-900 p-4 rounded-xl w-80">
          <h3 className="mb-3 font-semibold">Join requests</h3>

          {requests.map((r) => (
            <div
              key={r.socketId}
              className="flex items-center justify-between mb-2"
            >
              <span>{r.user?.displayName || "Guest"}</span>
              <button
                className="btn btn-success btn-sm"
                onClick={() => {
                  socket.emit("admit-user", {
                    roomId,
                    socketId: r.socketId,
                  });
                  setRequests((prev) =>
                    prev.filter((x) => x.socketId !== r.socketId)
                  );
                }}
              >
                Admit
              </button>
            </div>
          ))}
        </div>
      )}

      <Controls
        onVideo={toggleVideo}
        onAudio={toggleAudio}
        onScreen={startScreenShare}
        onLeave={leave}
      />
    </div>
  );
}
