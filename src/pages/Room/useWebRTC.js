import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";

const BACKEND_URL = "https://live-meeting-intelligence-backend.onrender.com";

export function useWebRTC(roomId, user) {
  /* ---------------- REFS ---------------- */
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const startedRef = useRef(false); // 🔑 prevents double start

  /* ---------------- STATE ---------------- */
  const [status, setStatus] = useState("idle");
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  /* ---------------- HELPERS ---------------- */

  const waitForVideos = async () => {
    while (!localVideoRef.current || !remoteVideoRef.current) {
      await new Promise((r) => setTimeout(r, 50));
    }
  };

  /* ---------------- EFFECT ---------------- */

  useEffect(() => {
    if (!user) return;

    // log("useEffect triggered");
    // log("User:", user.displayName);

    // Attach auth BEFORE connect
    socket.auth = {
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      },
    };

    socket.connect();
    socket.emit("join-room", { roomId, user });

    const onHost = async () => {
      await safeStart();
    };

    const onAdmitted = async () => {
      await safeStart();
    };

    socket.on("host", onHost);
    socket.on("admitted", onAdmitted);

    return () => {
      socket.off("host", onHost);
      socket.off("admitted", onAdmitted);
      cleanup();
    };
  }, [user, roomId]);

  /* ---------------- SAFE START ---------------- */

  const safeStart = async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    await waitForVideos();
    await startWebRTC();
    socket.emit("client-ready", { roomId });
  };

  /* ---------------- START WEBRTC ---------------- */

  const startWebRTC = async () => {
    /*  Local media */
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    if (!localVideoRef.current) {
      console.warn("[WebRTC] localVideoRef is null, aborting start");
      return;
    }
    localVideoRef.current.srcObject = stream;

    /*  ICE servers */
    const res = await fetch(`${BACKEND_URL}/api/ice`);
    const { iceServers } = await res.json();

    /*  Peer */
    peerRef.current = new RTCPeerConnection({ iceServers });

    stream
      .getTracks()
      .forEach((track) => peerRef.current.addTrack(track, stream));

    peerRef.current.ontrack = (e) => {
      if (!remoteVideoRef.current) {
        console.warn("[WebRTC] remoteVideoRef is null");
        return;
      }
      remoteVideoRef.current.srcObject = e.streams[0];
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

    /*  Signaling */
    socket.on("ready", onReady);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onRemoteIce);
  };

  /* ---------------- SIGNALING ---------------- */

  const onReady = async ({ callerId }) => {
    if (socket.id === callerId) {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit("offer", { offer, roomId });
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

  const startScreenShare = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) sender.replaceTrack(screenTrack);

    screenStreamRef.current = screenStream;
    setIsScreenSharing(true);
    screenTrack.onended = stopScreenShare;
  };

  const stopScreenShare = async () => {
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && cameraTrack) {
      sender.replaceTrack(cameraTrack);
    }

    // stop screen tracks
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }

    setIsScreenSharing(false);
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
    startedRef.current = false;
  };

  /* ---------------- EXPORT ---------------- */

  return {
    localVideoRef,
    remoteVideoRef,
    screenVideoRef,
    isScreenSharing,
    status,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
}
