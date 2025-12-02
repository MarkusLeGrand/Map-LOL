import { useRef, useEffect, useState } from "react";
import type { Token, Tower } from "../types";

interface MapBoardProps {
    boardSize: number;
    showGrid: boolean;
    gridSize: number;
    tokens: Token[];
    towers: Tower[];
    onTokenMove: (id: string, x: number, y: number) => void;
    onTowerToggle: (id: string) => void;
    showWalls: boolean;
    showBrush: boolean;
    showTowers: boolean;
}

export function MapBoard({ 
    boardSize, 
    showGrid, 
    gridSize, 
    tokens,
    towers,
    onTokenMove,
    onTowerToggle,
    showWalls,
    showBrush,
    showTowers
}: MapBoardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mapImage] = useState(() => {
        const img = new Image();
        img.src = "/maps/base.jpg";
        return img;
    });

    const [wallsImage] = useState(() => {
        const img = new Image();
        img.src = "/masks/walls.png";
        return img;
    });

    const [brushImage] = useState(() => {
        const img = new Image();
        img.src = "/masks/bush.png";
        return img;
    });

    const [draggingToken, setDraggingToken] = useState<string | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, boardSize, boardSize);

        if (mapImage.complete) {
            ctx.drawImage(mapImage, 0, 0, boardSize, boardSize);
        }

        if (showWalls && wallsImage.complete) {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(wallsImage, 0, 0, boardSize, boardSize);
            ctx.globalAlpha = 1.0;
        }

        if (showBrush && brushImage.complete) {
            ctx.globalAlpha = 0.3;
            ctx.drawImage(brushImage, 0, 0, boardSize, boardSize);
            ctx.globalAlpha = 1.0;
        }

        if (showGrid) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            const step = boardSize / gridSize;
            for (let i = 0; i <= gridSize; i++) {
                const pos = i * step;
                ctx.beginPath();
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, boardSize);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, pos);
                ctx.lineTo(boardSize, pos);
                ctx.stroke();
            }
        }

    }, [mapImage, wallsImage, brushImage, boardSize, showGrid, showWalls, showBrush, gridSize]);

    const handleTokenMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDraggingToken(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingToken) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / boardSize;
        const y = (e.clientY - rect.top) / boardSize;

        onTokenMove(draggingToken, x, y);
    };

    const handleMouseUp = () => {
        setDraggingToken(null);
    };

    const getTowerLabel = (type: Tower['type']) => {
        switch (type) {
            case 'outer': return 'T1';
            case 'inner': return 'T2';
            case 'inhibitor': return 'T3';
            case 'nexus': return 'T4';
        }
    };

    return (
        <div 
            className="relative"
            style={{ width: boardSize, height: boardSize }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                width={boardSize}
                height={boardSize}
                className="absolute top-0 left-0"
            />

            {showTowers && towers.map((tower) => {
                const x = tower.x * boardSize;
                const y = tower.y * boardSize;
                const size = 28;

                return (
                    <div
                        key={tower.id}
                        onClick={() => onTowerToggle(tower.id)}
                        className="absolute select-none cursor-pointer"
                        style={{
                            left: x - size / 2,
                            top: y - size / 2,
                            width: size,
                            height: size,
                        }}
                    >
                        <div 
                            className={`w-full h-full rounded-lg border-2 flex items-center justify-center text-xs font-bold ${
                                tower.active
                                    ? tower.team === 'blue' 
                                        ? 'bg-blue-600 border-blue-400' 
                                        : 'bg-red-600 border-red-400'
                                    : 'bg-gray-600 border-gray-400 opacity-40'
                            }`}
                            title={`${tower.team} ${tower.type} - ${tower.active ? 'Active' : 'Detruite'}`}
                        >
                            {getTowerLabel(tower.type)}
                        </div>
                    </div>
                );
            })}

            {tokens.filter(token => token.isVisible !== false).map((token) => {
                const x = token.x * boardSize;
                const y = token.y * boardSize;
                const size = 20;

                return (
                    <div
                        key={token.id}
                        onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
                        className="absolute cursor-move select-none"
                        style={{
                            left: x - size / 2,
                            top: y - size / 2,
                            width: size,
                            height: size,
                            zIndex: 10,
                        }}
                    >
                        <div
                            className={`w-full h-full rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                                token.team === 'blue'
                                    ? 'bg-blue-500 border-blue-300'
                                    : 'bg-red-500 border-red-300'
                            }`}
                        >
                            {token.role.charAt(0)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
