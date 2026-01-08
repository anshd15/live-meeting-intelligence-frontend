import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";

const BACKEND_URL = "https://live-meeting-intelligence-backend.onrender.com";

export function useWebRTC(roomId, user) {
  /* ---------------- REFS ---------------- */
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const isCaller = useRef(false);

  /* ---------------- STATE ---------------- */
  const [status, setStatus] = useState("idle");

  /* ---------------- EFFECT ---------------- */
  useEffect(() => {
    if (!user) return;

    const onAdmitted = () => {
      start();
    };

    // Host starts immediately
    socket.on("host", start);

    // Guest starts only after approval
    socket.on("admitted", onAdmitted);

    return () => {
      socket.off("host", start);
      socket.off("admitted", onAdmitted);
      cleanup();
    };
  }, [user]);

  /* ---------------- START ---------------- */
  const start = async () => {
    /* 🎥 Local media */
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    /* 🌐 ICE servers */
    const res = await fetch(`${BACKEND_URL}/api/ice`);
    const { iceServers } = await res.json();

    /* 🤝 Peer connection */
    peerRef.current = new RTCPeerConnection({ iceServers });

    stream
      .getTracks()
      .forEach((track) => peerRef.current.addTrack(track, stream));

    peerRef.current.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
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

    /* 🔌 Socket setup */
    socket.auth = {
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      },
    };

    socket.connect();
    socket.emit("join-room", roomId);

    /* 📞 Signaling listeners */
    socket.on("ready", onReady);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onRemoteIce);
  };

  /* ---------------- SIGNALING HANDLERS ---------------- */

  const onReady = ({ callerId }) => {
    if (socket.id === callerId) {
      isCaller.current = true;
      createOffer();
    }
  };

  const onOffer = async ({ offer }) => {
    await peerRef.current.setRemoteDescription(offer);
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer", { answer, roomId });
    flushCandidates();
  };

  const onAnswer = async ({ answer }) => {
    await peerRef.current.setRemoteDescription(answer);
    flushCandidates();
  };

  const onRemoteIce = async ({ candidate }) => {
    if (!peerRef.current.remoteDescription) {
      pendingCandidates.current.push(candidate);
    } else {
      await peerRef.current.addIceCandidate(candidate);
    }
  };

  const createOffer = async () => {
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socket.emit("offer", { offer, roomId });
  };

  const flushCandidates = () => {
    pendingCandidates.current.forEach((c) =>
      peerRef.current.addIceCandidate(c)
    );
    pendingCandidates.current = [];
  };

  /* ---------------- CONTROLS ---------------- */

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  };

  /* 🖥 Screen sharing (safe replaceTrack) */
  const startScreenShare = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) {
      sender.replaceTrack(screenTrack);
    }

    screenStreamRef.current = screenStream;

    screenTrack.onended = stopScreenShare;
  };

  const stopScreenShare = () => {
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && cameraTrack) {
      sender.replaceTrack(cameraTrack);
    }

    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
  };

  /* ---------------- CLEANUP ---------------- */

  const cleanup = () => {
    socket.off("ready", onReady);
    socket.off("offer", onOffer);
    socket.off("answer", onAnswer);
    socket.off("ice-candidate", onRemoteIce);

    socket.disconnect();

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());

    peerRef.current?.close();
    peerRef.current = null;
  };

  /* ---------------- EXPORT ---------------- */

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    cleanup,
  };
}
