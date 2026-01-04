import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const BACKEND_URL =
  "https://live-meeting-intelligence-backend.onrender.com";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  /* ---------------- AUTH ---------------- */
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate("/");
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, [navigate]);

  /* ---------------- SOCKET ---------------- */
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(BACKEND_URL, {
      withCredentials: true,
      auth: {
        user: {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
        },
      },
    });

    socketRef.current.emit("join-room", roomId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, roomId]);

  /* ---------------- REFS ---------------- */
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const pendingCandidates = useRef([]);
  const isCaller = useRef(false);

  /* ---------------- STATE ---------------- */
  const [status, setStatus] = useState("initializing");
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [quality, setQuality] = useState("—");

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (!user || !socketRef.current) return;

    init();

    return cleanup;
    // eslint-disable-next-line
  }, [user]);

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

    stream.getTracks().forEach((t) =>
      peerRef.current.addTrack(t, stream)
    );

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
      if (e.candidate) {
        socketRef.current.emit("ice-candidate", {
          candidate: e.candidate,
          roomId,
        });
      }
    };

    peerRef.current.oniceconnectionstatechange = () => {
      setStatus(peerRef.current.iceConnectionState);
    };
  };

  /* ---------------- SIGNALING ---------------- */

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("ready", ({ callerId }) => {
      if (socketRef.current.id === callerId) {
        isCaller.current = true;
        createOffer();
      }
    });

    socketRef.current.on("offer", async ({ offer }) => {
      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit("answer", { answer, roomId });
      flushCandidates();
    });

    socketRef.current.on("answer", async ({ answer }) => {
      if (peerRef.current.signalingState !== "have-local-offer") return;
      await peerRef.current.setRemoteDescription(answer);
      flushCandidates();
    });

    socketRef.current.on("ice-candidate", async ({ candidate }) => {
      if (!peerRef.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
      } else {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => socketRef.current.off();
  }, []);

  const createOffer = async () => {
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socketRef.current.emit("offer", { offer, roomId });
  };

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
    socketRef.current?.disconnect();
  };

  /* ---------------- UI ---------------- */

  if (!user) {
    return (
      <div style={container}>
        <p>Redirecting to login…</p>
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
        <button onClick={toggleAudio}>
          {audioOn ? "Mic ON" : "Mic OFF"}
        </button>
        <button onClick={leaveCall} style={{ background: "#ef4444" }}>
          Leave
        </button>
      </div>
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
