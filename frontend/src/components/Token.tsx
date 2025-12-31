import React from "react";
import type { Token as TokenType } from "../types";

interface TokenProps {
    token: TokenType;
    boardSize: number;
    gridSize: number;
    onDragStart: (id: string) => void;
    onDragEnd: (id: string, x: number, y: number) => void;
}

export const Token: React.FC<TokenProps> = ({ 
    token, 
    boardSize, 
    onDragStart,
    onDragEnd 
}) => {
    const radius = 10;
    const px = token.x * boardSize;
    const py = token.y * boardSize;

    const teamColors = {
        blue: "#3b82f6",
        red: "#ef4444",
        neutral: "#6b7280"
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        onDragStart(token.id);

        const svg = (e.target as SVGElement).closest('svg');
        if (!svg) return;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const rect = svg.getBoundingClientRect();
            const pixelX = Math.max(0, Math.min(boardSize, moveEvent.clientX - rect.left));
            const pixelY = Math.max(0, Math.min(boardSize, moveEvent.clientY - rect.top));
            
            const normX = pixelX / boardSize;
            const normY = pixelY / boardSize;
            
            onDragEnd(token.id, normX, normY);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    if (!token.isVisible) return null;

    const roleLabels: Record<string, string> = {
        'TOP': 'T',
        'JUNGLE': 'J',
        'MID': 'M',
        'ADC': 'A',
        'SUPPORT': 'S',
        'TOKEN': '?'
    };

    return (
        <g
            onMouseDown={handleMouseDown}
            style={{ cursor: "move" }}
        >
            <circle
                cx={px}
                cy={py}
                r={radius}
                fill={teamColors[token.team]}
                stroke="white"
                strokeWidth={1}
            />
            <text
                x={px}
                y={py}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={8}
                fontWeight="bold"
                pointerEvents="none"
            >
                {roleLabels[token.role] || '?'}
            </text>
        </g>
    );
};
