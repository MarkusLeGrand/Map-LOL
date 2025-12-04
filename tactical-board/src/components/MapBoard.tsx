import { useState } from 'react';
import type { Token, Tower, Ward, WardType, VisionMode, Drawing, DrawMode, JungleCamp as JungleCampType, Inhibitor } from '../types';
import { DISPLAY_CONFIG } from '../config/displayConfig';
import { MapCanvas } from './map/MapCanvas';
import { TowerElement } from './map/TowerElement';
import { TokenElement } from './map/TokenElement';
import { WardElement } from './map/WardElement';
import { DrawingLayer } from './map/DrawingLayer';
import { JungleCamp } from './map/JungleCamp';
import { InhibitorElement } from './map/InhibitorElement';
import { GridOverlay } from './map/GridOverlay';
import { calculateDistance } from '../utils/visionCalculations';

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
    jungleCamps: JungleCampType[];
    onJungleCampToggle: (id: string) => void;
    showJungleCamps: boolean;
    showCoordinates: boolean;
    inhibitors: Inhibitor[];
    onInhibitorToggle: (id: string) => void;
    showInhibitors: boolean;
    selectedGridCells: Set<string>;
    onGridCellToggle: (cellKey: string) => void;
    zoomLevel: number;
    panOffset: { x: number; y: number };
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
    onDrawingRemove,
    jungleCamps,
    onJungleCampToggle,
    showJungleCamps,
    showCoordinates,
    inhibitors,
    onInhibitorToggle,
    showInhibitors,
    selectedGridCells,
    onGridCellToggle,
    zoomLevel,
    panOffset,
}: MapBoardProps) {
    const [mapImage] = useState(() => {
        const img = new Image();
        img.src = '/maps/base.jpg';
        return img;
    });

    const [wallsImage] = useState(() => {
        const img = new Image();
        img.src = '/masks/walls.png';
        return img;
    });

    const [brushImage] = useState(() => {
        const img = new Image();
        img.src = '/masks/bush.png';
        return img;
    });

    const [draggingToken, setDraggingToken] = useState<string | null>(null);
    const [draggingWard, setDraggingWard] = useState<string | null>(null);
    const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Convert screen coordinates to map coordinates accounting for zoom and pan
    function screenToMapCoordinates(clientX: number, clientY: number, rect: DOMRect): { x: number; y: number } {
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        const x = relativeX / (zoomLevel * boardSize);
        const y = relativeY / (zoomLevel * boardSize);

        return { x, y };
    }

    function handleTokenMouseDown(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        setDraggingToken(id);
    }

    function handleWardMouseDown(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        if (placingWard) {
            return;
        }
        setDraggingWard(id);
    }

    function handleMouseMove(e: React.MouseEvent) {
        const rect = e.currentTarget.getBoundingClientRect();
        const { x, y } = screenToMapCoordinates(e.clientX, e.clientY, rect);

        if (draggingToken) {
            onTokenMove(draggingToken, x, y);
            return;
        }

        if (draggingWard) {
            onWardMove(draggingWard, x, y);
            return;
        }

        if (isDrawing && drawMode === 'pen') {
            setCurrentDrawing(prev => [...prev, { x, y }]);
        }
    }

    function handleMouseDown(e: React.MouseEvent) {
        if (placingWard) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const { x, y } = screenToMapCoordinates(e.clientX, e.clientY, rect);

        if (drawMode === 'pen') {
            setIsDrawing(true);
            setCurrentDrawing([{ x, y }]);
            return;
        }

        if (drawMode === 'eraser') {
            const eraserRadius = DISPLAY_CONFIG.DRAWING.ERASER_RADIUS;
            const drawingToRemove = drawings.find(drawing => {
                return drawing.points.some(point => {
                    const dist = calculateDistance(point.x, point.y, x, y);
                    return dist < eraserRadius;
                });
            });

            if (drawingToRemove) {
                onDrawingRemove(drawingToRemove.id);
            }
        }
    }

    function handleMouseUp() {
        setDraggingToken(null);
        setDraggingWard(null);

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
    }

    function handleClick(e: React.MouseEvent) {
        const rect = e.currentTarget.getBoundingClientRect();
        const { x, y } = screenToMapCoordinates(e.clientX, e.clientY, rect);

        if (placingWard) {
            onWardPlace(x, y);
            return;
        }

        // Grid cell selection mode - only with middle click when grid is shown
        if (e.button === 1 && showGrid && !drawMode && !draggingToken && !draggingWard) {
            const cellX = Math.floor(x * gridSize);
            const cellY = Math.floor(y * gridSize);
            const cellKey = `${cellX},${cellY}`;
            onGridCellToggle(cellKey);
        }
    }

    function handleContextMenu(e: React.MouseEvent) {
        e.preventDefault();

        const rect = e.currentTarget.getBoundingClientRect();
        const { x: clickX, y: clickY } = screenToMapCoordinates(e.clientX, e.clientY, rect);

        const clickRadius = 0.02;
        let closestWardId: string | null = null;
        let closestDist = clickRadius;

        wards.forEach(ward => {
            const dist = calculateDistance(ward.x, ward.y, clickX, clickY);
            if (dist < closestDist) {
                closestDist = dist;
                closestWardId = ward.id;
            }
        });

        if (closestWardId) {
            onWardRemove(closestWardId);
        }
    }

    const visibleTokens = tokens.filter(token => token.isVisible !== false);

    return (
        <div
            className="relative"
            style={{ width: boardSize, height: boardSize }}
            onMouseMove={handleMouseMove}
            onMouseDown={(e) => {
                handleMouseDown(e);
                // Also handle middle click for grid selection
                if (e.button === 1) {
                    handleClick(e);
                }
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            <MapCanvas
                boardSize={boardSize}
                showGrid={showGrid}
                gridSize={gridSize}
                showWalls={showWalls}
                showBrush={showBrush}
                mapImage={mapImage}
                wallsImage={wallsImage}
                brushImage={brushImage}
            />

            {showGrid && (
                <GridOverlay
                    boardSize={boardSize}
                    gridSize={gridSize}
                    selectedCells={selectedGridCells}
                />
            )}

            {showTowers && towers.map((tower) => (
                <TowerElement
                    key={tower.id}
                    tower={tower}
                    boardSize={boardSize}
                    onToggle={onTowerToggle}
                />
            ))}

            {visibleTokens.map((token) => (
                <TokenElement
                    key={token.id}
                    token={token}
                    boardSize={boardSize}
                    onMouseDown={handleTokenMouseDown}
                    showCoordinates={showCoordinates}
                />
            ))}

            {wards.map(ward => (
                <WardElement
                    key={ward.id}
                    ward={ward}
                    boardSize={boardSize}
                    visionMode={visionMode}
                    placingWard={placingWard}
                    onMouseDown={handleWardMouseDown}
                />
            ))}

            {showJungleCamps && jungleCamps.map(camp => (
                <JungleCamp
                    key={camp.id}
                    camp={camp}
                    mapWidth={boardSize}
                    mapHeight={boardSize}
                    onClick={onJungleCampToggle}
                />
            ))}

            {showInhibitors && inhibitors.map(inhibitor => (
                <InhibitorElement
                    key={inhibitor.id}
                    inhibitor={inhibitor}
                    mapWidth={boardSize}
                    mapHeight={boardSize}
                    onClick={onInhibitorToggle}
                />
            ))}

            <DrawingLayer
                drawings={drawings}
                currentDrawing={currentDrawing}
                isDrawing={isDrawing}
                boardSize={boardSize}
            />
        </div>
    );
}
