import React from "react";

interface GridProps {
    boardSize: number;
    gridSize: number;
    show: boolean;
}

const Grid: React.FC<GridProps> = ({ boardSize, gridSize, show }) => {
    if (!show) return null;

    const cellSize = boardSize / gridSize;
    const lines = [];

    for (let i = 0; i <= gridSize; i++) {
        const pos = i * cellSize;

        lines.push(
            <line
                key={`h-${i}`}
                x1={0}
                y1={pos}
                x2={boardSize}
                y2={pos}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
            />
        );

        lines.push(
            <line
                key={`v-${i}`}
                x1={pos}
                y1={0}
                x2={pos}
                y2={boardSize}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
            />
        );
    }

    return (
        <svg
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: boardSize,
                height: boardSize,
                pointerEvents: "none",
            }}
        >
            {lines}
        </svg>
    );
};

export default Grid;
