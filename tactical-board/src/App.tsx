import { useCallback, useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { MapBoard } from './components/MapBoard';
import { FogOfWar } from './components/FogOfWar';
import { MapViewPanel } from './components/panels/MapViewPanel';
import { WardsPanel } from './components/panels/WardsPanel';
import { useGameState } from './hooks/useGameState';
import { useTokenHandlers } from './hooks/useTokenHandlers';
import { useTowerHandlers } from './hooks/useTowerHandlers';
import { useWardHandlers } from './hooks/useWardHandlers';
import { useDrawingHandlers } from './hooks/useDrawingHandlers';
import { useVisibleEntities } from './hooks/useVisibleEntities';
import { useFaelightMasks } from './hooks/useFaelightMasks';
import { useFaelightActivations } from './hooks/useFaelightActivations';
import type { DrawMode } from './types';

const GRID = 10;

export default function App() {
    const gameState = useGameState();

    const {
        boardSize,
        showGrid,
        setShowGrid,
        showWalls,
        setShowWalls,
        showBrush,
        setShowBrush,
        visionMode,
        setVisionMode,
        visionData,
        setVisionData,
        brushData,
        setBrushData,
        tokens,
        setTokens,
        towers,
        setTowers,
        wards,
        setWards,
        drawings,
        setDrawings,
        jungleCamps,
        setJungleCamps,
        inhibitors,
        setInhibitors,
        faelights,
        showFaelights,
        placingWard,
        setPlacingWard,
        selectedTeam,
        setSelectedTeam,
        drawMode,
        setDrawMode,
        showJungleCamps,
        setShowJungleCamps,
        showCoordinates,
        setShowCoordinates,
        showTowers,
        setShowTowers,
        showInhibitors,
        setShowInhibitors,
        selectedGridCells,
        setSelectedGridCells,
        zoomLevel,
        setZoomLevel,
        panOffset,
        setPanOffset,
    } = gameState;

    const { handleTokenMove } = useTokenHandlers({ setTokens });

    const { handleTowerToggle } = useTowerHandlers({
        towers,
        setTowers,
    });

    const toggleAllTowersAndInhibitors = useCallback(() => {
        const allActive = towers.every(t => t.active) && inhibitors.every(i => i.active);
        setTowers(towers => towers.map(t => ({ ...t, active: !allActive })));
        setInhibitors(inhibs => inhibs.map(i => ({ ...i, active: !allActive })));
    }, [towers, inhibitors, setTowers, setInhibitors]);

    const toggleAllJungleCamps = useCallback(() => {
        const allActive = jungleCamps.every(c => c.active);
        setJungleCamps(camps => camps.map(c => ({ ...c, active: !allActive })));
    }, [jungleCamps, setJungleCamps]);

    const { handleWardPlace, handleWardRemove, handleWardMove, handleClearAllWards } = useWardHandlers({
        setWards,
        placingWard,
        selectedTeam,
    });

    const { handleDrawingAdd, handleDrawingRemove, handleClearAllDrawings } = useDrawingHandlers({
        setDrawings,
    });

    const { wardsWithDisabledStatus, visibleTokens, visibleWards } = useVisibleEntities({
        tokens,
        wards,
        visionMode,
        visionData,
        brushData,
        boardSize,
    });

    const { masks: faelightMasks } = useFaelightMasks(faelights);
    const faelightActivations = useFaelightActivations(faelights, wardsWithDisabledStatus);

    const handleVisionUpdate = useCallback((vision: ImageData, brush: ImageData) => {
        setVisionData(vision);
        setBrushData(brush);
    }, []); // State setters are stable, no need to include them

    const handleToggleVisionMode = useCallback((mode: 'blue' | 'red' | 'both') => {
        if (visionMode === mode) {
            setVisionMode('off');
        } else {
            setVisionMode(mode);
        }
    }, [visionMode, setVisionMode]);

    const handleToggleGrid = useCallback(() => {
        setShowGrid(!showGrid);
    }, [showGrid, setShowGrid]);

    const handleToggleWalls = useCallback(() => {
        setShowWalls(!showWalls);
    }, [showWalls, setShowWalls]);

    const handleToggleBrush = useCallback(() => {
        setShowBrush(!showBrush);
    }, [showBrush, setShowBrush]);

    const handleToggleCoordinates = useCallback(() => {
        setShowCoordinates(!showCoordinates);
    }, [showCoordinates, setShowCoordinates]);

    const handleToggleTowers = useCallback(() => {
        const newValue = !showTowers;
        setShowTowers(newValue);
        setShowInhibitors(newValue);
    }, [showTowers, setShowTowers, setShowInhibitors]);

    const handleToggleJungleCamps = useCallback(() => {
        setShowJungleCamps(!showJungleCamps);
    }, [showJungleCamps, setShowJungleCamps]);

    const handleDrawModeChange = useCallback((mode: DrawMode) => {
        setDrawMode(mode);
    }, [setDrawMode]);

    const handleGridCellToggle = useCallback((cellKey: string) => {
        setSelectedGridCells(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cellKey)) {
                newSet.delete(cellKey);
            } else {
                newSet.add(cellKey);
            }
            return newSet;
        });
    }, [setSelectedGridCells]);

    const handleResetView = useCallback(() => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    }, [setZoomLevel, setPanOffset]);

    const handleExportToPNG = useCallback(async () => {
        const container = zoomContainerRef.current;
        if (!container) return;

        try {
            const canvas = await html2canvas(container, {
                backgroundColor: '#1f2937', // gray-800
                scale: 2, // Higher quality
                logging: false,
            });

            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `tactical-board-${Date.now()}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error('Failed to export PNG:', error);
        }
    }, []);

    const activeWards = wardsWithDisabledStatus.filter(w => !w.disabled);

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const zoomContainerRef = useRef<HTMLDivElement>(null);

    // Setup native wheel event listener to avoid passive listener warning
    useEffect(() => {
        const container = zoomContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 3));
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [setZoomLevel]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 2) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    }, [panOffset]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        }
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    return (
        <div className="w-screen h-screen bg-gray-900 text-white flex">
            <MapViewPanel
                showGrid={showGrid}
                onShowGridToggle={handleToggleGrid}
                showWalls={showWalls}
                onShowWallsToggle={handleToggleWalls}
                showBrush={showBrush}
                onShowBrushToggle={handleToggleBrush}
                showCoordinates={showCoordinates}
                onShowCoordinatesToggle={handleToggleCoordinates}
                visionMode={visionMode}
                onVisionModeToggle={handleToggleVisionMode}
                drawMode={drawMode}
                onDrawModeChange={handleDrawModeChange}
                onClearAllDrawings={handleClearAllDrawings}
                onResetView={handleResetView}
                onExportToPNG={handleExportToPNG}
            />

            <div
                className="flex-1 flex items-center justify-center p-8 overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
                style={{ cursor: isPanning ? 'grabbing' : 'default' }}
            >
                <div
                    ref={zoomContainerRef}
                    style={{
                        position: 'relative',
                        width: boardSize,
                        height: boardSize,
                        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                    }}
                >
                    <MapBoard
                        boardSize={boardSize}
                        showGrid={showGrid}
                        gridSize={GRID}
                        tokens={visibleTokens}
                        towers={towers}
                        onTokenMove={handleTokenMove}
                        onTowerToggle={handleTowerToggle}
                        showWalls={showWalls}
                        showBrush={showBrush}
                        showTowers={showTowers}
                        wards={visibleWards}
                        placingWard={placingWard}
                        onWardPlace={handleWardPlace}
                        onWardRemove={handleWardRemove}
                        onWardMove={handleWardMove}
                        visionMode={visionMode}
                        drawings={drawings}
                        drawMode={drawMode}
                        onDrawingAdd={handleDrawingAdd}
                        onDrawingRemove={handleDrawingRemove}
                        jungleCamps={jungleCamps}
                        onJungleCampToggle={(id) => {
                            setJungleCamps(camps =>
                                camps.map(camp =>
                                    camp.id === id ? { ...camp, active: !camp.active } : camp
                                )
                            );
                        }}
                        showJungleCamps={showJungleCamps}
                        showCoordinates={showCoordinates}
                        inhibitors={inhibitors}
                        onInhibitorToggle={(id) => {
                            setInhibitors(inhibs =>
                                inhibs.map(inhib =>
                                    inhib.id === id ? { ...inhib, active: !inhib.active } : inhib
                                )
                            );
                        }}
                        showInhibitors={showInhibitors}
                        faelights={faelights}
                        faelightActivations={faelightActivations}
                        showFaelights={showFaelights}
                        selectedGridCells={selectedGridCells}
                        onGridCellToggle={handleGridCellToggle}
                        zoomLevel={zoomLevel}
                        panOffset={panOffset}
                    />
                    <FogOfWar
                        boardSize={boardSize}
                        tokens={tokens}
                        towers={towers}
                        visionMode={visionMode}
                        onVisionUpdate={handleVisionUpdate}
                        wards={activeWards}
                        faelights={faelights}
                        faelightActivations={faelightActivations}
                        faelightMasks={faelightMasks}
                    />
                </div>
            </div>

            <WardsPanel
                selectedTeam={selectedTeam}
                onSelectedTeamChange={setSelectedTeam}
                placingWard={placingWard}
                onPlacingWardChange={setPlacingWard}
                wards={wards}
                onClearAllWards={handleClearAllWards}
                towers={towers}
                onToggleAllTowers={toggleAllTowersAndInhibitors}
                jungleCamps={jungleCamps}
                onToggleAllJungleCamps={toggleAllJungleCamps}
                inhibitors={inhibitors}
                showTowers={showTowers}
                onShowTowersToggle={handleToggleTowers}
                showJungleCamps={showJungleCamps}
                onShowJungleCampsToggle={handleToggleJungleCamps}
            />
        </div>
    );
}
