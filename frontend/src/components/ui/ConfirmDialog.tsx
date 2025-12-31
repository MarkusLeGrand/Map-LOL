import { COLORS } from '../../constants/theme';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmDialogProps) {
  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return { backgroundColor: COLORS.danger };
      case 'warning':
        return { backgroundColor: COLORS.gold };
      case 'info':
      default:
        return { backgroundColor: COLORS.primary };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={onCancel}>
      <div className="bg-[#1A1A1A] border border-[#F5F5F5]/10 p-8 max-w-md w-full rounded-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[#F5F5F5] text-2xl font-bold mb-3">{title}</h2>
        <p className="text-[#F5F5F5]/70 text-base mb-8 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-[#F5F5F5]/5 text-[#F5F5F5] hover:bg-[#F5F5F5]/10 transition-colors rounded border border-[#F5F5F5]/10"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-[#F5F5F5] font-medium hover:opacity-90 transition-opacity rounded"
            style={getConfirmButtonStyle()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
