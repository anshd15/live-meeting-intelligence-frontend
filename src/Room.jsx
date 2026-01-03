import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";

const BACKEND_URL =
  "https://live-meeting-intelligence-backend.onrender.com";

const socket = io(BACKEND_URL, { withCredentials: true });

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const pendingCandidates = useRef([]);
  const isCaller = useRef(false);

  const [status, setStatus] = useState("initializing");
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [quality, setQuality] = useState("—");

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    init();
    return cleanup;
    // eslint-disable-next-line
  }, [roomId]);

  const init = async () => {
    // Media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    // ICE
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

  /* ---------------- SIGNALING ---------------- */

  socket.on("ready", ({ callerId }) => {
    if (socket.id === callerId) {
      isCaller.current = true;
      createOffer();
    }
  });

  const createOffer = async () => {
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socket.emit("offer", { offer, roomId });
  };

  socket.on("offer", async ({ offer }) => {
    await peerRef.current.setRemoteDescription(offer);
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer", { answer, roomId });
    flushCandidates();
  });

  socket.on("answer", async ({ answer }) => {
    if (peerRef.current.signalingState !== "have-local-offer") return;
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

  const toggleScreenShare = async () => {
    if (!screenOn) {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenStreamRef.current = screen;

      const sender = peerRef.current
        .getSenders()
        .find((s) => s.track.kind === "video");

      sender.replaceTrack(screen.getVideoTracks()[0]);
      localVideoRef.current.srcObject = screen;
      setScreenOn(true);

      screen.getVideoTracks()[0].onended = stopScreenShare;
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track.kind === "video");

    sender.replaceTrack(
      localStreamRef.current.getVideoTracks()[0]
    );
    localVideoRef.current.srcObject = localStreamRef.current;
    setScreenOn(false);
  };

  /* ---------------- CONNECTION QUALITY ---------------- */

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!peerRef.current) return;
      const stats = await peerRef.current.getStats();
      stats.forEach((r) => {
        if (r.type === "candidate-pair" && r.currentRoundTripTime) {
          if (r.currentRoundTripTime < 0.15) setQuality("Good");
          else if (r.currentRoundTripTime < 0.4)
            setQuality("Medium");
          else setQuality("Poor");
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- LEAVE / RECONNECT ---------------- */

  const leaveCall = () => {
    cleanup();
    navigate("/");
  };

  const reconnect = async () => {
    await peerRef.current.restartIce();
    setStatus("reconnecting");
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    socket.off();
  };

  /* ---------------- UI ---------------- */

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
        <button onClick={toggleScreenShare}>
          {screenOn ? "Stop Share" : "Share Screen"}
        </button>
        <button onClick={reconnect}>Reconnect</button>
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
