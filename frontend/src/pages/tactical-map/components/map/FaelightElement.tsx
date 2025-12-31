import type { Faelight, FaelightActivation } from '../../types';

interface FaelightElementProps {
    faelight: Faelight;
    boardSize: number;
    activations: FaelightActivation[];
}

export function FaelightElement({ faelight, boardSize, activations }: FaelightElementProps) {
    const size = 20; // Same as ward size
    const x = faelight.x * boardSize - size / 2;
    const y = faelight.y * boardSize - size / 2;

    // Check if this Faelight is activated by either team
    const isActivated = activations.some(a => a.faelightId === faelight.id);

    return (
        <div
            className="absolute select-none pointer-events-none"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
                zIndex: 8, // Above towers (5), below wards (15)
            }}
            title={faelight.name}
        >
            {/* Main Faelight circle - yellow with transparency */}
            <div
                className="w-full h-full rounded-full border-2"
                style={{
                    backgroundColor: isActivated
                        ? 'rgba(234, 179, 8, 0.7)'  // Yellow-600 with higher opacity when active
                        : 'rgba(234, 179, 8, 0.4)', // More transparent when inactive
                    borderColor: 'rgba(250, 204, 21, 0.9)', // Yellow-400 border
                    boxShadow: isActivated
                        ? '0 0 10px rgba(234, 179, 8, 0.8)' // Glow effect when active
                        : 'none',
                }}
            />

            {/* Detection radius circle (subtle, dashed) */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed pointer-events-none"
                style={{
                    width: faelight.detectionRadius * boardSize * 2,
                    height: faelight.detectionRadius * boardSize * 2,
                    borderColor: 'rgba(234, 179, 8, 0.2)', // Very subtle
                }}
            />
        </div>
    );
}
