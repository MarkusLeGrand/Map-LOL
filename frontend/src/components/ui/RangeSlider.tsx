import { COLORS } from '../../constants/theme';

interface RangeSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    unit?: string;
    color?: string;
}

export function RangeSlider({
    label,
    value,
    min,
    max,
    onChange,
    unit = 'px',
    color = COLORS.primary,
}: RangeSliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="px-2 py-3 border border-[#F5F5F5]/10 bg-[#0E0E0E]">
            <div className="text-[#F5F5F5]/60 text-xs font-medium mb-2 tracking-wide">
                {label}: {value}{unit}
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-[#F5F5F5]/10 rounded-lg appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgba(245, 245, 245, 0.1) ${percentage}%, rgba(245, 245, 245, 0.1) 100%)`,
                    accentColor: color,
                }}
            />
        </div>
    );
}
