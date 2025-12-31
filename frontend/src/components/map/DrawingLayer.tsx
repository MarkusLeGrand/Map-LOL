import type { Drawing } from '../../types';
import { DISPLAY_CONFIG } from '../../config/displayConfig';

interface DrawingLayerProps {
    drawings: Drawing[];
    currentDrawing: { x: number; y: number }[];
    isDrawing: boolean;
    boardSize: number;
    penColor: string;
    penWidth: number;
}

export function DrawingLayer({ drawings, currentDrawing, isDrawing, boardSize, penColor, penWidth }: DrawingLayerProps) {
    function createPathData(points: { x: number; y: number }[]): string {
        return points
            .map((point, i) => {
                const x = point.x * boardSize;
                const y = point.y * boardSize;
                if (i === 0) {
                    return `M ${x} ${y}`;
                }
                return `L ${x} ${y}`;
            })
            .join(' ');
    }

    return (
        <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: boardSize, height: boardSize, zIndex: DISPLAY_CONFIG.Z_INDEX.DRAWING }}
            width={boardSize}
            height={boardSize}
        >
            {drawings.map(drawing => {
                if (drawing.points.length < 2) {
                    return null;
                }

                const pathData = createPathData(drawing.points);

                return (
                    <path
                        key={drawing.id}
                        d={pathData}
                        stroke={drawing.color}
                        strokeWidth={drawing.width}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                );
            })}

            {isDrawing && currentDrawing.length > 1 && (
                <path
                    d={createPathData(currentDrawing)}
                    stroke={penColor}
                    strokeWidth={penWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </svg>
    );
}
