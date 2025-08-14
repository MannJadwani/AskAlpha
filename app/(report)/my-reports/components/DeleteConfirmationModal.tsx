interface DeleteConfirmationModalProps {
  isOpen: boolean;
  reportToDelete: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  reportToDelete,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#0a0c10] border border-white/10 rounded-2xl p-6 max-w-md w-full text-zinc-300 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">
          Confirm Deletion
        </h3>
        <p className="text-zinc-400 mb-6">
          {reportToDelete 
            ? "Are you sure you want to delete this report? This action cannot be undone."
            : "Are you sure you want to delete all saved reports? This action cannot be undone."}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-white/5 text-zinc-200 ring-1 ring-inset ring-white/10 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600/90 text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
