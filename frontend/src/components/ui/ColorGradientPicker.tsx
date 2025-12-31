import { COLORS } from '../../constants/theme';

interface ColorGradientPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
}

export function ColorGradientPicker({
    value,
    onChange,
    label = 'COLOR',
}: ColorGradientPickerProps) {
    function interpolateColor(color1: string, color2: string, factor: number): string {
        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);
        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);

        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function handleColorBarClick(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;

        // Gradient colors: black -> red -> orange -> yellow -> green -> blue -> indigo -> violet -> white
        const gradientStops = [
            COLORS.black,
            '#ff0000',
            COLORS.orange,
            '#ffff00',
            '#00ff00',
            '#0000ff',
            '#4b0082',
            '#9400d3',
            COLORS.white,
        ];

        const segmentSize = 1 / (gradientStops.length - 1);
        const segmentIndex = Math.floor(percentage / segmentSize);
        const segmentProgress = (percentage % segmentSize) / segmentSize;

        if (segmentIndex >= gradientStops.length - 1) {
            onChange(gradientStops[gradientStops.length - 1]);
        } else {
            const color = interpolateColor(
                gradientStops[segmentIndex],
                gradientStops[segmentIndex + 1],
                segmentProgress
            );
            onChange(color);
        }
    }

    return (
        <div className="px-2 py-3 border border-[#F5F5F5]/10 bg-[#0E0E0E]">
            <div className="flex items-center gap-2 mb-2">
                <div className="text-[#F5F5F5]/60 text-xs font-medium tracking-wide">{label}</div>
                <div
                    className="w-4 h-4 rounded-full border-2 border-[#F5F5F5]"
                    style={{ backgroundColor: value }}
                />
            </div>
            {/* Rainbow gradient bar with black and white */}
            <div
                onClick={handleColorBarClick}
                className="h-8 rounded-full cursor-pointer"
                style={{
                    background:
                        'linear-gradient(to right, #000000, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ffffff)',
                }}
            />
        </div>
    );
}
