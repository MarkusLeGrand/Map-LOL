import { Button } from '../ui/Button';
import type { VisionMode, DrawMode } from '../../types';

interface MapViewPanelProps {
    showGrid: boolean;
    onShowGridToggle: () => void;
    showWalls: boolean;
    onShowWallsToggle: () => void;
    showBrush: boolean;
    onShowBrushToggle: () => void;
    showCoordinates: boolean;
    onShowCoordinatesToggle: () => void;
    visionMode: VisionMode;
    onVisionModeToggle: (mode: 'blue' | 'red' | 'both') => void;
    drawMode: DrawMode;
    onDrawModeChange: (mode: DrawMode) => void;
    onClearAllDrawings: () => void;
    onResetView: () => void;
}

export function MapViewPanel({
    showGrid,
    onShowGridToggle,
    showWalls,
    onShowWallsToggle,
    showBrush,
    onShowBrushToggle,
    showCoordinates,
    onShowCoordinatesToggle,
    visionMode,
    onVisionModeToggle,
    drawMode,
    onDrawModeChange,
    onClearAllDrawings,
    onResetView,
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
        <div className="w-80 bg-gray-800 p-4 flex flex-col gap-4 border-r border-gray-700 overflow-y-auto">
            <h2 className="text-xl font-bold text-center">Map View</h2>

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

                <Button onClick={onShowCoordinatesToggle} variant="green" active={showCoordinates}>
                    {showCoordinates && '✓ '}Show Coordinates
                </Button>

                <Button onClick={onResetView} variant="orange">
                    Reset View
                </Button>
            </div>

            <hr className="border-gray-700" />

            <h2 className="text-xl font-bold text-center">Fog of War</h2>

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

            <hr className="border-gray-700" />

            <h2 className="text-xl font-bold text-center">Drawing</h2>

            <div className="flex flex-col gap-2">
                <Button onClick={handlePenClick} variant="green" active={drawMode === 'pen'}>
                    {drawMode === 'pen' && '✓ '}Pen
                </Button>

                <Button onClick={handleEraserClick} variant="orange" active={drawMode === 'eraser'}>
                    {drawMode === 'eraser' && '✓ '}Eraser
                </Button>

                <Button onClick={onClearAllDrawings} variant="danger">
                    Clear All Drawings
                </Button>
            </div>
        </div>
    );
}
