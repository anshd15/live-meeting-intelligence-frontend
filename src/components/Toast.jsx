export default function Toast({ message }) {
  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-lg border border-slate-700">
      {message}
    </div>
  );
}
