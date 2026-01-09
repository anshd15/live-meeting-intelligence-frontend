import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function GoogleLoginButton() {
  const navigate = useNavigate();

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      // 🔥 NAVIGATE IMMEDIATELY AFTER FIREBASE LOGIN
      // navigate("/dashboard");

      // 🔹 Backend sync should NOT block navigation
      const userPayload = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };

      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userPayload),
      }).catch((err) => {
        console.warn("Backend sync failed:", err);
      });

    } catch (err) {
      console.error("Google login failed:", err);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <button onClick={login} className="btn btn-primary">
      Sign in with Google
    </button>
  );
}
