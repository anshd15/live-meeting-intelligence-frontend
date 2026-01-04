export default function WaitingPopup({ request, onApprove, onReject }) {
  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 p-4 rounded-xl">
      <div className="flex gap-3 items-center">
        <img
          src={request.user.photoURL}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold">{request.user.name}</p>
          <p className="text-xs text-slate-400">{request.user.email}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={onApprove} className="btn btn-success btn-sm">
          Let In
        </button>
        <button onClick={onReject} className="btn btn-error btn-sm">
          Reject
        </button>
      </div>
    </div>
  );
}
