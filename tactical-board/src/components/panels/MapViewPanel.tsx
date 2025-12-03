import { Button } from '../ui/Button';
import type { VisionMode, DrawMode } from '../../types';

interface MapViewPanelProps {
    boardSize: number;
    onBoardSizeChange: (size: number) => void;
    showGrid: boolean;
    onShowGridToggle: () => void;
    showWalls: boolean;
    onShowWallsToggle: () => void;
    showBrush: boolean;
    onShowBrushToggle: () => void;
    showJungleCamps: boolean;
    onShowJungleCampsToggle: () => void;
    visionMode: VisionMode;
    onVisionModeToggle: (mode: 'blue' | 'red' | 'both') => void;
    drawMode: DrawMode;
    onDrawModeChange: (mode: DrawMode) => void;
    onClearAllDrawings: () => void;
}

export function MapViewPanel({
    boardSize,
    onBoardSizeChange,
    showGrid,
    onShowGridToggle,
    showWalls,
    onShowWallsToggle,
    showBrush,
    onShowBrushToggle,
    showJungleCamps,
    onShowJungleCampsToggle,
    visionMode,
    onVisionModeToggle,
    drawMode,
    onDrawModeChange,
    onClearAllDrawings,
}: MapViewPanelProps) {
    function handlePenClick() {
        if (drawMode === 'pen') {
            onDrawModeChange(null);
        } else {
            onDrawModeChange('pen');
        }
    }

    function handleEraserClick() {
        if (drawMode === 'eraser') {
            onDrawModeChange(null);
        } else {
            onDrawModeChange('eraser');
        }
    }

    return (
        <div className="w-64 bg-gray-800 p-4 flex flex-col gap-4 border-r border-gray-700 overflow-y-auto">
            <h2 className="text-xl font-bold">Map View</h2>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Zoom: {boardSize}px</label>
                <input
                    type="range"
                    min="600"
                    max="949"
                    value={boardSize}
                    onChange={(e) => onBoardSizeChange(Number(e.target.value))}
                    className="w-full"
                />
            </div>

            <div className="flex flex-col gap-2">
                <Button onClick={onShowGridToggle} variant="green" active={showGrid}>
                    {showGrid && '✓ '}Show Grid
                </Button>

                <Button onClick={onShowWallsToggle} variant="green" active={showWalls}>
                    {showWalls && '✓ '}Show Walls
                </Button>

                <Button onClick={onShowBrushToggle} variant="green" active={showBrush}>
                    {showBrush && '✓ '}Show Brush
                </Button>

                <Button onClick={onShowJungleCampsToggle} variant="green" active={showJungleCamps}>
                    {showJungleCamps && '✓ '}Show Jungle Camps
                </Button>
            </div>

            <hr className="border-gray-700" />

            <h3 className="text-lg font-bold">Fog of War</h3>

            <div className="flex flex-col gap-2">
                <Button
                    onClick={() => onVisionModeToggle('blue')}
                    variant="blue"
                    active={visionMode === 'blue'}
                >
                    Blue Vision
                </Button>

                <Button
                    onClick={() => onVisionModeToggle('red')}
                    variant="red"
                    active={visionMode === 'red'}
                >
                    Red Vision
                </Button>

                <Button
                    onClick={() => onVisionModeToggle('both')}
                    variant="purple"
                    active={visionMode === 'both'}
                >
                    Both Vision
                </Button>
            </div>

            {visionMode !== 'off' && (
                <div className="text-xs text-gray-400">
                    Active mode: {visionMode} (click to disable)
                </div>
            )}

            <hr className="border-gray-700" />

            <h3 className="text-lg font-bold">Drawing</h3>

            <div className="flex flex-col gap-2">
                <Button onClick={handlePenClick} variant="red" active={drawMode === 'pen'}>
                    {drawMode === 'pen' && '✓ '}Pen
                </Button>

                <Button onClick={handleEraserClick} variant="orange" active={drawMode === 'eraser'}>
                    {drawMode === 'eraser' && '✓ '}Eraser
                </Button>

                <Button onClick={onClearAllDrawings} variant="danger">
                    Clear All Drawings
                </Button>
            </div>

            {drawMode === 'pen' && (
                <div className="text-xs text-yellow-400">
                    Click and drag to draw
                </div>
            )}
            {drawMode === 'eraser' && (
                <div className="text-xs text-yellow-400">
                    Click on a drawing to erase
                </div>
            )}
        </div>
    );
}
