import { COLORS } from '../../constants/theme';

interface ToggleButtonProps {
    label: string;
    isActive: boolean;
    onChange: () => void;
    activeColor?: string;
    showCheckmark?: boolean;
    fullWidth?: boolean;
}

export function ToggleButton({
    label,
    isActive,
    onChange,
    activeColor = COLORS.blue,
    showCheckmark = true,
    fullWidth = true,
}: ToggleButtonProps) {
    return (
        <button
            onClick={onChange}
            className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                fullWidth ? 'w-full' : ''
            } ${
                isActive
                    ? `bg-[${activeColor}] text-[#F5F5F5] border-[${activeColor}]`
                    : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#F5F5F5]/20'
            }`}
            style={
                isActive
                    ? {
                          backgroundColor: activeColor,
                          borderColor: activeColor,
                      }
                    : undefined
            }
        >
            {isActive && showCheckmark && '✓ '}
            {label}
        </button>
    );
}
