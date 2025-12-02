import { useCallback } from 'react';
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
import type { DrawMode } from './types';

const GRID = 10;

export default function App() {
    const gameState = useGameState();

    const {
        boardSize,
        setBoardSize,
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
        placingWard,
        setPlacingWard,
        selectedTeam,
        setSelectedTeam,
        drawMode,
        setDrawMode,
    } = gameState;

    const { handleTokenMove } = useTokenHandlers({ setTokens });

    const { handleTowerToggle, toggleAllTowers } = useTowerHandlers({
        towers,
        setTowers,
    });

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

    const handleVisionUpdate = useCallback((vision: ImageData, brush: ImageData) => {
        setVisionData(vision);
        setBrushData(brush);
    }, [setVisionData, setBrushData]);

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

    const handleDrawModeChange = useCallback((mode: DrawMode) => {
        setDrawMode(mode);
    }, [setDrawMode]);

    const activeWards = wardsWithDisabledStatus.filter(w => !w.disabled);

    return (
        <div className="w-screen h-screen bg-gray-900 text-white flex">
            <MapViewPanel
                boardSize={boardSize}
                onBoardSizeChange={setBoardSize}
                showGrid={showGrid}
                onShowGridToggle={handleToggleGrid}
                showWalls={showWalls}
                onShowWallsToggle={handleToggleWalls}
                showBrush={showBrush}
                onShowBrushToggle={handleToggleBrush}
                visionMode={visionMode}
                onVisionModeToggle={handleToggleVisionMode}
                drawMode={drawMode}
                onDrawModeChange={handleDrawModeChange}
                onClearAllDrawings={handleClearAllDrawings}
            />

            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
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
                        showTowers={true}
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
                    />
                    <FogOfWar
                        boardSize={boardSize}
                        tokens={tokens}
                        towers={towers}
                        visionMode={visionMode}
                        onVisionUpdate={handleVisionUpdate}
                        wards={activeWards}
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
                onToggleAllTowers={toggleAllTowers}
            />
        </div>
    );
}
