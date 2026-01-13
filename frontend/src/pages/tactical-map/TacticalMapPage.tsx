import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { MapBoard } from '../../components/MapBoard.tsx';
import { FogOfWar } from '../../components/FogOfWar.tsx';
import { ViewModePanel } from '../../components/panels/ViewModePanel.tsx';
import { VisionModePanel } from '../../components/panels/VisionModePanel.tsx';
import { ToolsModePanel } from '../../components/panels/ToolsModePanel.tsx';
import { Header } from '../../components/layout/Header.tsx';
import { TabPanel } from '../../components/ui/TabPanel.tsx';
import { useGameState } from './hooks/useGameState.ts';
import { useTokenHandlers } from './hooks/useTokenHandlers.ts';
import { useTowerHandlers } from './hooks/useTowerHandlers.ts';
import { useWardHandlers } from './hooks/useWardHandlers.ts';
import { useDrawingHandlers } from './hooks/useDrawingHandlers.ts';
import { useVisibleEntities } from './hooks/useVisibleEntities.ts';
import { useFaelightMasks } from './hooks/useFaelightMasks.ts';
import { useFaelightActivations } from './hooks/useFaelightActivations.ts';
import { VISION_RANGES } from './config/visionRanges.ts';
import { COLORS } from '../../constants/theme.ts';
import type { DrawMode } from './types/types.ts';

const GRID = 10;

type SidebarMode = 'view' | 'vision' | 'tools';

export default function TacticalMapPage() {
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('view');

    // Add no-scroll class to body when on map page
    useEffect(() => {
        document.body.classList.add('no-scroll');
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, []);
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
        setShowFaelights,
        showEvolvedFaelights,
        setShowEvolvedFaelights,
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
        penColor,
        setPenColor,
        penWidth,
        setPenWidth,
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

    // Filter Faelights based on category toggles
    // showFaelights controls base category, showEvolvedFaelights adds evolved category
    const filteredFaelights = useMemo(() => {
        return faelights.filter(faelight => {
            if (faelight.category === 'base') return showFaelights;
            if (faelight.category === 'evolved') return showFaelights && showEvolvedFaelights;
            return false;
        });
    }, [faelights, showFaelights, showEvolvedFaelights]);

    const { masks: faelightMasks } = useFaelightMasks(filteredFaelights);
    const faelightActivations = useFaelightActivations(filteredFaelights, wardsWithDisabledStatus);

    const handleVisionUpdate = useCallback((vision: ImageData, brush: ImageData) => {
        setVisionData(vision);
        setBrushData(brush);
    }, []); // State setters are stable, no need to include them

    const handleToggleVisionMode = useCallback((mode: 'blue' | 'red' | 'both') => {
        if (visionMode === mode) {
            setVisionMode('off');
            // Clear vision data when turning off to prevent stale data issues
            setVisionData(null);
            setBrushData(null);
        } else {
            setVisionMode(mode);
        }
    }, [visionMode, setVisionMode, setVisionData, setBrushData]);

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

    const handleToggleFaelights = useCallback(() => {
        setShowFaelights(!showFaelights);
    }, [showFaelights, setShowFaelights]);

    const handleToggleEvolvedFaelights = useCallback(() => {
        setShowEvolvedFaelights(!showEvolvedFaelights);
    }, [showEvolvedFaelights, setShowEvolvedFaelights]);

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

    // Handle Farsight Ward vision reduction after 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setWards(currentWards =>
                currentWards.map(ward => {
                    if (ward.type === 'farsight' && ward.placedAt) {
                        const timeSincePlacement = now - ward.placedAt;
                        // After 2000ms (2 seconds), reduce vision radius
                        if (timeSincePlacement >= 2000 && ward.visionRadius === VISION_RANGES.FARSIGHT_WARD_INITIAL) {
                            return {
                                ...ward,
                                visionRadius: VISION_RANGES.FARSIGHT_WARD_REDUCED
                            };
                        }
                    }
                    return ward;
                })
            );
        }, 100); // Check every 100ms

        return () => clearInterval(interval);
    }, [setWards]);

    return (
        <div className="w-screen h-screen bg-[#0E0E0E] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Header
                tagline="PRO TOOLS FOR EVERYONE"
                showToolsLink={true}
            />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 border border-[#F5F5F5]/10 bg-[#0E0E0E] flex flex-col rounded-lg m-6 mr-0">
                    <TabPanel
                        tabs={[
                            {
                                id: 'view',
                                label: 'View',
                                color: COLORS.blue,
                                content: (
                                    <ViewModePanel
                                        showGrid={showGrid}
                                        onShowGridToggle={handleToggleGrid}
                                        showWalls={showWalls}
                                        onShowWallsToggle={handleToggleWalls}
                                        showBrush={showBrush}
                                        onShowBrushToggle={handleToggleBrush}
                                        showCoordinates={showCoordinates}
                                        onShowCoordinatesToggle={handleToggleCoordinates}
                                        showTowers={showTowers}
                                        onShowTowersToggle={handleToggleTowers}
                                        onToggleAllTowers={toggleAllTowersAndInhibitors}
                                        allTowersActive={towers.every(t => t.active) && inhibitors.every(i => i.active)}
                                        showJungleCamps={showJungleCamps}
                                        onShowJungleCampsToggle={handleToggleJungleCamps}
                                        onToggleAllJungleCamps={toggleAllJungleCamps}
                                        allJungleCampsActive={jungleCamps.every(c => c.active)}
                                    />
                                ),
                            },
                            {
                                id: 'vision',
                                label: 'Vision',
                                color: COLORS.primary,
                                content: (
                                    <VisionModePanel
                                        visionMode={visionMode}
                                        onVisionModeToggle={handleToggleVisionMode}
                                        selectedTeam={selectedTeam}
                                        onSelectedTeamChange={setSelectedTeam}
                                        placingWard={placingWard}
                                        onPlacingWardChange={setPlacingWard}
                                        onClearAllWards={handleClearAllWards}
                                        showFaelights={showFaelights}
                                        onShowFaelightsToggle={handleToggleFaelights}
                                        showEvolvedFaelights={showEvolvedFaelights}
                                        onShowEvolvedFaelightsToggle={handleToggleEvolvedFaelights}
                                    />
                                ),
                            },
                            {
                                id: 'tools',
                                label: 'Tools',
                                color: COLORS.purple,
                                content: (
                                    <ToolsModePanel
                                        drawMode={drawMode}
                                        onDrawModeChange={handleDrawModeChange}
                                        onClearAllDrawings={handleClearAllDrawings}
                                        onExportToPNG={handleExportToPNG}
                                        penColor={penColor}
                                        onPenColorChange={setPenColor}
                                        penWidth={penWidth}
                                        onPenWidthChange={setPenWidth}
                                    />
                                ),
                            },
                        ]}
                        activeTab={sidebarMode}
                        onChange={(tabId) => setSidebarMode(tabId as SidebarMode)}
                        className="flex-1"
                    />
                </aside>

                {/* Map Container */}
                <div
                    className="flex-1 flex items-center justify-center overflow-hidden"
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
                            faelights={filteredFaelights}
                            faelightActivations={faelightActivations}
                            showFaelights={showFaelights}
                            selectedGridCells={selectedGridCells}
                            onGridCellToggle={handleGridCellToggle}
                            zoomLevel={zoomLevel}
                            panOffset={panOffset}
                            penColor={penColor}
                            penWidth={penWidth}
                        />
                        <FogOfWar
                            boardSize={boardSize}
                            tokens={tokens}
                            towers={towers}
                            visionMode={visionMode}
                            onVisionUpdate={handleVisionUpdate}
                            wards={activeWards}
                            faelights={filteredFaelights}
                            faelightActivations={faelightActivations}
                            faelightMasks={faelightMasks}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-[#F5F5F5]/10 py-3 bg-[#0E0E0E]">
                <div className="px-6 flex items-center justify-between">
                    <p className="text-[#F5F5F5]/30 text-xs tracking-wide">
                        Tactical Map — Professional Vision Control
                    </p>
                    <div className="flex gap-4 text-xs text-[#F5F5F5]/40">
                        <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                        <span>Mode: {sidebarMode.charAt(0).toUpperCase() + sidebarMode.slice(1)}</span>
                        <span>Wards: {wards.length}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
