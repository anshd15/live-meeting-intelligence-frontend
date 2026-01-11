import Hero from "./Hero";
import Features from "./Features";
import Developer from "./Developer";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 text-white overflow-hidden antialiased">
      <Hero />
      <Features />
      <Developer />
      <Footer />
    </div>
  );
}
