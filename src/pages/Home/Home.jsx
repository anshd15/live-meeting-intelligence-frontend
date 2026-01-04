import Hero from "./Hero";
import JoinRoom from "./JoinRoom";
import Features from "./Features";
import Developer from "./Developer";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden">
      <Hero />
      <JoinRoom />
      <Features />
      <Developer />
      <Footer />
    </div>
  );
}
