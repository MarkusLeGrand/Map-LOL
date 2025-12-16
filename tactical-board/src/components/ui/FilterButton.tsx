interface FilterButtonProps {
    label: string;
    count?: number;
    isActive: boolean;
    onChange: () => void;
    color?: string;
}

export function FilterButton({
    label,
    count,
    isActive,
    onChange,
    color,
}: FilterButtonProps) {
    const displayLabel = count !== undefined ? `${label} (${count})` : label;

    // If no color provided, use white for "All" button
    const bgColor = color || '#F5F5F5';
    const textColor = color ? '#0E0E0E' : '#0E0E0E';

    return (
        <button
            onClick={onChange}
            className={`px-6 py-3 text-sm font-medium transition-all border ${
                isActive
                    ? `border-[${bgColor}]`
                    : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10'
            }`}
            style={
                isActive
                    ? {
                          backgroundColor: bgColor,
                          borderColor: bgColor,
                          color: textColor,
                      }
                    : {
                          borderColor: 'rgba(245, 245, 245, 0.1)',
                      }
            }
        >
            {displayLabel}
        </button>
    );
}
