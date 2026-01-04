import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export default function GoogleLoginButton() {
  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <button onClick={login} className="btn btn-primary">
      Sign in with Google
    </button>
  );
}
