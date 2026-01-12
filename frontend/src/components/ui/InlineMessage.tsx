import { COLORS } from '../../constants/colors';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

interface InlineMessageProps {
  message: string;
  type: MessageType;
  className?: string;
}

export function InlineMessage({ message, type, className = '' }: InlineMessageProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: COLORS.successBg,
          border: COLORS.successBorder,
          text: COLORS.success,
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'error':
        return {
          bg: COLORS.errorBg,
          border: COLORS.errorBorder,
          text: COLORS.error,
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'warning':
        return {
          bg: COLORS.warningBg,
          border: COLORS.warningBorder,
          text: COLORS.warning,
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bg: COLORS.infoBg,
          border: COLORS.infoBorder,
          text: COLORS.info,
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const { bg, border, text, icon } = getTypeStyles();

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${className}`}
      style={{
        backgroundColor: bg,
        borderColor: border,
        color: text
      }}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
