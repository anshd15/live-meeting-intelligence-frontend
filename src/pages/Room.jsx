import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import GoogleLoginButton from "../components/GoogleLoginButton";

const BACKEND_URL = "https://live-meeting-intelligence-backend.onrender.com";

const socket = io(BACKEND_URL, {
  withCredentials: true,
  auth: {
    user: {
      name: user?.displayName,
      email: user?.email,
      photo: user?.photoURL,
    },
  },
});

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  /* ---------------- AUTH ---------------- */
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* ---------------- REFS ---------------- */
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const pendingCandidates = useRef([]);
  const isHost = useRef(false);
  const approved = useRef(false);

  /* ---------------- STATE ---------------- */
  const [status, setStatus] = useState("initializing");
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [quality, setQuality] = useState("—");

  const [joinRequest, setJoinRequest] = useState(null);
  const [waiting, setWaiting] = useState(true);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    if (!user) return;
    init();
    return cleanup;
    // eslint-disable-next-line
  }, [roomId, user]);

  const init = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    const res = await fetch(`${BACKEND_URL}/api/ice`);
    const { iceServers } = await res.json();

    peerRef.current = new RTCPeerConnection({ iceServers });

    stream.getTracks().forEach((t) => peerRef.current.addTrack(t, stream));

    peerRef.current.ontrack = (e) => {
      const remoteStream = e.streams[0];
      remoteVideoRef.current.srcObject = remoteStream;

      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        setRemoteMuted(!audioTrack.enabled);
        audioTrack.onmute = () => setRemoteMuted(true);
        audioTrack.onunmute = () => setRemoteMuted(false);
      }
    };

    peerRef.current.onicecandidate = (e) => {
      if (e.candidate && approved.current) {
        socket.emit("ice-candidate", {
          candidate: e.candidate,
          roomId,
        });
      }
    };

    peerRef.current.oniceconnectionstatechange = () => {
      setStatus(peerRef.current.iceConnectionState);
    };

    socket.emit("join-room", roomId);
  };

  /* ---------------- JOIN / APPROVAL FLOW ---------------- */

  socket.on("host", () => {
    isHost.current = true;
    approved.current = true;
    setWaiting(false);
  });

  socket.on("request-join", (data) => {
    if (isHost.current) {
      setJoinRequest(data);
    }
  });

  socket.on("join-approved", () => {
    approved.current = true;
    setWaiting(false);
  });

  socket.on("join-rejected", () => {
    alert("Host rejected your request");
    navigate("/");
  });

  /* ---------------- SIGNALING ---------------- */

  socket.on("ready", async ({ callerId }) => {
    if (!approved.current) return;
    if (socket.id === callerId) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId });
    }
  });

  socket.on("offer", async ({ offer }) => {
    if (!approved.current) return;
    await peerRef.current.setRemoteDescription(offer);
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer", { answer, roomId });
    flushCandidates();
  });

  socket.on("answer", async ({ answer }) => {
    if (!approved.current) return;
    await peerRef.current.setRemoteDescription(answer);
    flushCandidates();
  });

  socket.on("ice-candidate", async ({ candidate }) => {
    if (!peerRef.current.remoteDescription) {
      pendingCandidates.current.push(candidate);
    } else {
      await peerRef.current.addIceCandidate(candidate);
    }
  });

  const flushCandidates = () => {
    pendingCandidates.current.forEach((c) =>
      peerRef.current.addIceCandidate(c)
    );
    pendingCandidates.current = [];
  };

  /* ---------------- CONTROLS ---------------- */

  const toggleVideo = () => {
    const track = localStreamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
  };

  const toggleAudio = () => {
    const track = localStreamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setAudioOn(track.enabled);
  };

  const leaveCall = () => {
    cleanup();
    navigate("/");
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    socket.off();
  };

  /* ---------------- UI ---------------- */

  if (!user) {
    return (
      <div style={container}>
        <h2 style={{ marginBottom: 12 }}>Sign in to join the meeting</h2>

        <GoogleLoginButton />

        <p style={{ marginTop: 16, opacity: 0.7 }}>
          We use Google sign-in to identify participants
        </p>
      </div>
    );
  }

  if (waiting && !isHost.current) {
    socket.emit("request-join", {
      roomId,
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      },
    });

    return (
      <div style={container}>
        <p>⏳ Waiting for host approval...</p>
      </div>
    );
  }

  return (
    <div style={container}>
      <h3>Room: {roomId}</h3>
      <p>
        ICE: <b>{status}</b> | Quality: <b>{quality}</b>
      </p>

      {remoteMuted && <p>🔇 Remote user muted</p>}

      <div style={videoRow}>
        <video ref={localVideoRef} autoPlay muted playsInline />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>

      <div style={controls}>
        <button onClick={toggleVideo}>
          {videoOn ? "Video ON" : "Video OFF"}
        </button>
        <button onClick={toggleAudio}>{audioOn ? "Mic ON" : "Mic OFF"}</button>
        <button onClick={leaveCall} style={{ background: "#ef4444" }}>
          Leave
        </button>
      </div>

      {/* HOST POPUP */}
      {joinRequest && (
        <div style={popup}>
          <img src={joinRequest.user.photo} width={40} />
          <p>{joinRequest.user.name}</p>
          <button
            onClick={() => {
              socket.emit("approve-join", {
                socketId: joinRequest.socketId,
              });
              setJoinRequest(null);
            }}
          >
            Let In
          </button>
          <button
            onClick={() => {
              socket.emit("reject-join", {
                socketId: joinRequest.socketId,
              });
              setJoinRequest(null);
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const container = {
  height: "100vh",
  background: "#0f172a",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const videoRow = {
  display: "flex",
  gap: 20,
};

const controls = {
  marginTop: 20,
  display: "flex",
  gap: 12,
};

const popup = {
  position: "fixed",
  bottom: 20,
  right: 20,
  background: "#020617",
  padding: 12,
  borderRadius: 8,
};
