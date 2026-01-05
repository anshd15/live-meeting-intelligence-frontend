import { io } from "socket.io-client";

const BACKEND_URL =
  "https://live-meeting-intelligence-backend.onrender.com";

const socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
