import { useRef, useEffect, useState } from "react";
import type { Token, Tower, Ward, WardType, VisionMode } from "../types";

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
    wards: Ward[];
    placingWard: WardType | null;
    onWardPlace: (x: number, y: number) => void;
    onWardRemove: (id: string) => void;
    onWardMove: (id: string, x: number, y: number) => void;
    visionMode: VisionMode;
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
    showTowers,
    wards,
    placingWard,
    onWardPlace,
    onWardRemove,
    onWardMove,
    visionMode
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
    const [draggingWard, setDraggingWard] = useState<string | null>(null);

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

    const handleWardMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (placingWard) return; // Ne pas déplacer en mode placement
        setDraggingWard(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / boardSize;
        const y = (e.clientY - rect.top) / boardSize;

        if (draggingToken) {
            onTokenMove(draggingToken, x, y);
        } else if (draggingWard) {
            onWardMove(draggingWard, x, y);
        }
    };

    const handleMouseUp = () => {
        setDraggingToken(null);
        setDraggingWard(null);
    };

    const getTowerLabel = (type: Tower['type']) => {
        switch (type) {
            case 'outer': return 'T1';
            case 'inner': return 'T2';
            case 'inhibitor': return 'T3';
            case 'nexus': return 'T4';
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!placingWard) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / boardSize;
        const y = (e.clientY - rect.top) / boardSize;
        onWardPlace(x, y);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!placingWard) return;

        // Clic droit : chercher et supprimer la ward la plus proche
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) / boardSize;
        const clickY = (e.clientY - rect.top) / boardSize;

        // Trouver la ward la plus proche dans un rayon de 0.02 (2%)
        const clickRadius = 0.02;
        let closestWardId: string | null = null;
        let closestDist = clickRadius;

        wards.forEach(ward => {
            const dist = Math.sqrt((ward.x - clickX) ** 2 + (ward.y - clickY) ** 2);
            if (dist < closestDist) {
                closestDist = dist;
                closestWardId = ward.id;
            }
        });

        if (closestWardId) {
            onWardRemove(closestWardId);
        }
    };

    return (
        <div
            className="relative"
            style={{ width: boardSize, height: boardSize }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
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
                const size = 32;

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

            {/* Wards */}
            {wards.map(ward => {
                const x = ward.x * boardSize;
                const y = ward.y * boardSize;
                const size = 24;

                return (
                    <div
                        key={ward.id}
                        onMouseDown={(e) => handleWardMouseDown(e, ward.id)}
                        className={`absolute select-none ${placingWard ? 'pointer-events-none' : 'cursor-move'}`}
                        style={{
                            left: x - size / 2,
                            top: y - size / 2,
                            width: size,
                            height: size,
                            zIndex: 15,
                            opacity: ward.disabled ? 0.3 : 1,
                        }}
                        title={ward.disabled ? 'Désactivée par Control Ward' : ''}
                    >
                        {/* Cercle de vision en pointillé (uniquement si fog off) */}
                        {visionMode === 'off' && (
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed pointer-events-none"
                                style={{
                                    width: ward.visionRadius * boardSize * 2,
                                    height: ward.visionRadius * boardSize * 2,
                                    borderColor: ward.team === 'blue' ? 'rgba(147, 197, 253, 0.4)' : 'rgba(252, 165, 165, 0.4)',
                                }}
                            />
                        )}

                        {/* Icône ward */}
                        <div
                            className={`w-full h-full rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                                ward.type === 'vision'
                                    ? `bg-yellow-400 ${ward.team === 'blue' ? 'border-blue-300' : 'border-red-300'}`
                                    : `bg-pink-500 ${ward.team === 'blue' ? 'border-blue-300' : 'border-red-300'}`
                            }`}
                        />
                    </div>
                );
            })}
        </div>
    );
}
