import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";

const BACKEND_URL = "https://live-meeting-intelligence-backend.onrender.com";

export function useWebRTC(roomId, user) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const isCaller = useRef(false);

  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!user) return; 

    start();

    return cleanup;
    // eslint-disable-next-line
  }, [user]);

  const start = async () => {
    // 1️⃣ Media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    // 2️⃣ ICE servers
    const res = await fetch(`${BACKEND_URL}/api/ice`);
    const { iceServers } = await res.json();

    // 3️⃣ Peer
    peerRef.current = new RTCPeerConnection({ iceServers });

    stream.getTracks().forEach((t) => peerRef.current.addTrack(t, stream));

    peerRef.current.ontrack = (e) => {
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

    // 4️⃣ Socket
    socket.auth = {
      user: {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      },
    };

    socket.connect();
    socket.emit("join-room", roomId);

    socket.on("ready", ({ callerId }) => {
      if (socket.id === callerId) {
        isCaller.current = true;
        createOffer();
      }
    });

    socket.on("offer", async ({ offer }) => {
      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit("answer", { answer, roomId });
      flushCandidates();
    });

    socket.on("answer", async ({ answer }) => {
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

  const toggleAudio = () => {
    const track = localStreamRef.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
  };

  const toggleVideo = () => {
    const track = localStreamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    socket.disconnect();
  };

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    toggleAudio,
    toggleVideo,
    cleanup,
  };
}
