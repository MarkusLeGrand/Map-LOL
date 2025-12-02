import { useRef, useEffect, useState } from "react";
import type { Token, Tower, Ward, WardType, VisionMode, Drawing, DrawMode,} from "../types";
import { DISPLAY_CONFIG, getTeamColors, getTowerColors } from "../config/displayConfig";

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
    drawings: Drawing[];
    drawMode: DrawMode;
    onDrawingAdd: (drawing: Drawing) => void;
    onDrawingRemove: (id: string) => void;
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
    visionMode,
    drawings,
    drawMode,
    onDrawingAdd,
    onDrawingRemove
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
    const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

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
        } else if (isDrawing && drawMode === 'pen') {
            // Ajouter un point au dessin en cours
            setCurrentDrawing(prev => [...prev, { x, y }]);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Ne pas dessiner si on est en mode placement de ward
        if (placingWard) return;

        if (drawMode === 'pen') {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / boardSize;
            const y = (e.clientY - rect.top) / boardSize;
            setIsDrawing(true);
            setCurrentDrawing([{ x, y }]);
        } else if (drawMode === 'eraser') {
            // Mode gomme : trouver et supprimer le dessin cliqué
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) / boardSize;
            const clickY = (e.clientY - rect.top) / boardSize;

            const eraserRadius = DISPLAY_CONFIG.DRAWING.ERASER_RADIUS;
            const drawingToRemove = drawings.find(drawing => {
                return drawing.points.some(point => {
                    const dist = Math.sqrt((point.x - clickX) ** 2 + (point.y - clickY) ** 2);
                    return dist < eraserRadius;
                });
            });

            if (drawingToRemove) {
                onDrawingRemove(drawingToRemove.id);
            }
        }
    };

    const handleMouseUp = () => {
        setDraggingToken(null);
        setDraggingWard(null);

        // Finaliser le dessin si on était en train de dessiner
        if (isDrawing && drawMode === 'pen' && currentDrawing.length > 1) {
            const newDrawing: Drawing = {
                id: `drawing-${Date.now()}-${Math.random()}`,
                points: currentDrawing,
                color: DISPLAY_CONFIG.DRAWING.PEN_COLOR,
                width: DISPLAY_CONFIG.DRAWING.PEN_WIDTH,
            };
            onDrawingAdd(newDrawing);
        }

        setIsDrawing(false);
        setCurrentDrawing([]);
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
            onMouseDown={handleMouseDown}
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
                const size = DISPLAY_CONFIG.SIZES.TOWER;
                const colors = getTowerColors(tower.team, tower.active);

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
                            className={`w-full h-full ${DISPLAY_CONFIG.ROUNDED.TOWER} ${DISPLAY_CONFIG.BORDER_WIDTH} flex items-center justify-center ${DISPLAY_CONFIG.TEXT.TOWER_LABEL_SIZE} font-bold ${colors.background} ${colors.border} ${!tower.active ? `opacity-${Math.round(DISPLAY_CONFIG.OPACITY.TOWER_DESTROYED * 100)}` : ''}`}
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
                const size = DISPLAY_CONFIG.SIZES.CHAMPION_TOKEN;
                const teamColors = getTeamColors(token.team);

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
                            zIndex: DISPLAY_CONFIG.Z_INDEX.CHAMPION,
                        }}
                    >
                        <div
                            className={`w-full h-full ${DISPLAY_CONFIG.ROUNDED.CHAMPION} ${DISPLAY_CONFIG.BORDER_WIDTH} flex items-center justify-center ${DISPLAY_CONFIG.TEXT.CHAMPION_ROLE_SIZE} font-bold ${teamColors.primary} ${teamColors.border}`}
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
                const size = ward.type === 'vision' ? DISPLAY_CONFIG.SIZES.VISION_WARD : DISPLAY_CONFIG.SIZES.CONTROL_WARD;
                const teamColors = getTeamColors(ward.team);
                const wardBg = ward.type === 'vision' ? DISPLAY_CONFIG.COLORS.WARDS.VISION.background : DISPLAY_CONFIG.COLORS.WARDS.CONTROL.background;

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
                            zIndex: DISPLAY_CONFIG.Z_INDEX.WARD,
                            opacity: ward.disabled ? DISPLAY_CONFIG.OPACITY.WARD_DISABLED : 1,
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
                                    borderColor: teamColors.visionCircle,
                                }}
                            />
                        )}

                        {/* Icône ward */}
                        <div
                            className={`w-full h-full ${DISPLAY_CONFIG.ROUNDED.WARD} ${DISPLAY_CONFIG.BORDER_WIDTH} flex items-center justify-center ${DISPLAY_CONFIG.TEXT.WARD_SYMBOL_SIZE} font-bold ${wardBg} ${teamColors.border}`}
                        />
                    </div>
                );
            })}

            {/* Dessins */}
            <svg
                className="absolute top-0 left-0 pointer-events-none"
                style={{ width: boardSize, height: boardSize, zIndex: DISPLAY_CONFIG.Z_INDEX.DRAWING }}
                width={boardSize}
                height={boardSize}
            >
                {/* Dessins finalisés */}
                {drawings.map(drawing => {
                    if (drawing.points.length < 2) return null;

                    const pathData = drawing.points
                        .map((point, i) => {
                            const x = point.x * boardSize;
                            const y = point.y * boardSize;
                            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                        })
                        .join(' ');

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

                {/* Dessin en cours */}
                {isDrawing && currentDrawing.length > 1 && (
                    <path
                        d={currentDrawing
                            .map((point, i) => {
                                const x = point.x * boardSize;
                                const y = point.y * boardSize;
                                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                            })
                            .join(' ')}
                        stroke={DISPLAY_CONFIG.DRAWING.PEN_COLOR}
                        strokeWidth={DISPLAY_CONFIG.DRAWING.PEN_WIDTH}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
            </svg>
        </div>
    );
}
