import { useState, useCallback, useMemo } from "react";
import { MapBoard } from "./components/MapBoard";
import { FogOfWar } from "./components/FogOfWar";
import { defaultTokens } from "./data/defaultTokens";
import { defaultTowers } from "./data/defaultTowers";
import type { Token, Tower, VisionMode, Ward, WardType, Drawing, DrawMode } from "./types";
import { VISION_RANGES } from "./config/visionRanges";

export default function App() {
    const [boardSize, setBoardSize] = useState(800);
    const [showGrid, setShowGrid] = useState(true);
    const [tokens, setTokens] = useState<Token[]>(defaultTokens);
    const [towers, setTowers] = useState<Tower[]>(defaultTowers);
    const [showWalls, setShowWalls] = useState(false);
    const [showBrush, setShowBrush] = useState(false);
    const [visionMode, setVisionMode] = useState<VisionMode>('off');
    const [visionData, setVisionData] = useState<ImageData | null>(null);
    const [brushData, setBrushData] = useState<ImageData | null>(null);
    const [wards, setWards] = useState<Ward[]>([]);
    const [placingWard, setPlacingWard] = useState<WardType | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<'blue' | 'red'>('blue');
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [drawMode, setDrawMode] = useState<DrawMode>(null);

    const GRID = 10;

    const handleTokenMove = (id: string, x: number, y: number) => {
        setTokens(prev => prev.map(t => 
            t.id === id ? { ...t, x, y } : t
        ));
    };

    const handleTowerToggle = (id: string) => {
        setTowers(prev => prev.map(t =>
            t.id === id ? { ...t, active: !t.active } : t
        ));
    };

    const toggleAllTowers = () => {
        const allActive = towers.every(t => t.active);
        setTowers(prev => prev.map(t => ({ ...t, active: !allActive })));
    };

    const toggleVisionMode = (mode: 'blue' | 'red' | 'both') => {
        setVisionMode(prev => prev === mode ? 'off' : mode);
    };

    const handleVisionUpdate = useCallback((vision: ImageData, brush: ImageData) => {
        setVisionData(vision);
        setBrushData(brush);
    }, []);

    const handleWardPlace = useCallback((x: number, y: number) => {
        if (!placingWard) return;

        const newWard: Ward = {
            id: `ward-${Date.now()}-${Math.random()}`,
            x,
            y,
            team: selectedTeam,
            type: placingWard,
            active: true,
            visionRadius: placingWard === 'vision' ? VISION_RANGES.VISION_WARD : VISION_RANGES.CONTROL_WARD,
            disabled: false,
        };

        setWards(prev => [...prev, newWard]);
        // Ne plus désactiver le mode après placement
    }, [placingWard, selectedTeam]);

    const handleWardRemove = useCallback((id: string) => {
        setWards(prev => prev.filter(w => w.id !== id));
    }, []);

    const handleWardMove = useCallback((id: string, x: number, y: number) => {
        setWards(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
    }, []);

    const handleClearAllWards = useCallback(() => {
        setWards([]);
    }, []);

    // Handlers pour le dessin
    const handleDrawingAdd = useCallback((drawing: Drawing) => {
        setDrawings(prev => [...prev, drawing]);
    }, []);

    const handleDrawingRemove = useCallback((id: string) => {
        setDrawings(prev => prev.filter(d => d.id !== id));
    }, []);

    const handleClearAllDrawings = useCallback(() => {
        setDrawings([]);
    }, []);

    // Calculer quelles wards sont désactivées par Control Wards ennemies
    const wardsWithDisabledStatus = useMemo(() => {
        return wards.map(ward => {
            // Les Control Wards ne peuvent pas être désactivées
            if (ward.type === 'control') {
                return { ...ward, disabled: false };
            }

            // Vérifier si une Control Ward ennemie est dans le rayon
            const isDisabled = wards.some(enemyWard => {
                if (enemyWard.type !== 'control') return false;
                if (enemyWard.team === ward.team) return false;
                if (!enemyWard.active) return false;

                const dist = Math.sqrt(
                    (ward.x - enemyWard.x) ** 2 + (ward.y - enemyWard.y) ** 2
                );
                return dist <= enemyWard.visionRadius;
            });

            return { ...ward, disabled: isDisabled };
        });
    }, [wards]);

    // Calculer les tokens visibles
    const visibleTokens = useMemo(() => {
        if (visionMode === 'off' || !visionData || !brushData) {
            return tokens; // Tous visibles si fog off
        }

        return tokens.map(token => {
            // Les alliés sont toujours visibles
            const isAlly =
                (visionMode === 'blue' && token.team === 'blue') ||
                (visionMode === 'red' && token.team === 'red') ||
                (visionMode === 'both');

            if (isAlly) {
                return { ...token, isVisible: true };
            }

            // Pour les ennemis, vérifier s'ils sont dans la vision
            const x = Math.floor(token.x * boardSize);
            const y = Math.floor(token.y * boardSize);
            const idx = (y * boardSize + x) * 4;

            const inVision = visionData.data[idx] > 0; // blanc = visible

            // Vérifier si le token est dans un brush
            const brushIdx = Math.floor((token.y * 512)) * 512 + Math.floor((token.x * 512));
            const brushPixelIdx = brushIdx * 4;
            const inBrush = brushData.data[brushPixelIdx] > 128;

            // Si dans un brush, vérifier si un allié OU Control Ward alliée est dans ce bush
            let allyInSameBrush = false;
            if (inBrush) {
                // Vérifier Control Wards alliées dans le brush
                const hasControlWardInBrush = wardsWithDisabledStatus.some(ward => {
                    if (ward.type !== 'control' || !ward.active || ward.disabled) return false;

                    const isAllyWard =
                        (visionMode === 'blue' && ward.team === 'blue') ||
                        (visionMode === 'red' && ward.team === 'red');
                    if (!isAllyWard) return false;

                    // Vérifier si ward est dans un brush
                    const wardBrushIdx = Math.floor(ward.y * 512) * 512 + Math.floor(ward.x * 512);
                    const wardBrushPixelIdx = wardBrushIdx * 4;
                    const wardInBrush = brushData.data[wardBrushPixelIdx] > 128;

                    // Même brush si proche ET tous deux dans brush
                    const dist = Math.sqrt((token.x - ward.x) ** 2 + (token.y - ward.y) ** 2);
                    return wardInBrush && dist < VISION_RANGES.SAME_BRUSH_RADIUS;
                });

                if (hasControlWardInBrush) {
                    allyInSameBrush = true;
                } else {
                    // Vérifier champions alliés (logique existante)
                    tokens.forEach(t => {
                        const tIsAlly =
                            (visionMode === 'blue' && t.team === 'blue') ||
                            (visionMode === 'red' && t.team === 'red');

                        if (tIsAlly) {
                            const tBrushIdx = Math.floor((t.y * 512)) * 512 + Math.floor((t.x * 512));
                            const tBrushPixelIdx = tBrushIdx * 4;
                            const tInBrush = brushData.data[tBrushPixelIdx] > 128;

                            // Même brush si proche et tous deux dans brush
                            const dist = Math.sqrt((token.x - t.x) ** 2 + (token.y - t.y) ** 2);
                            if (tInBrush && dist < VISION_RANGES.SAME_BRUSH_RADIUS) {
                                allyInSameBrush = true;
                            }
                        }
                    });
                }
            }

            return { ...token, isVisible: inVision || allyInSameBrush };
        });
    }, [tokens, visionMode, visionData, brushData, boardSize, wardsWithDisabledStatus]);

    // Calculer les wards visibles
    const visibleWards = useMemo(() => {
        if (visionMode === 'off') {
            return wardsWithDisabledStatus; // Toutes visibles si fog off
        }

        return wardsWithDisabledStatus.filter(ward => {
            // Les wards alliées sont toujours visibles
            const isAlly =
                (visionMode === 'blue' && ward.team === 'blue') ||
                (visionMode === 'red' && ward.team === 'red') ||
                (visionMode === 'both');

            if (isAlly) return true;

            // CAS 1: Vision Wards ennemies révélées par Control Ward alliée
            if (ward.type === 'vision') {
                const revealedByControlWard = wardsWithDisabledStatus.some(allyWard => {
                    // Doit être une Control Ward
                    if (allyWard.type !== 'control') return false;
                    // Doit être active et non désactivée
                    if (!allyWard.active || allyWard.disabled) return false;
                    // Doit être alliée
                    const isAllyControlWard =
                        (visionMode === 'blue' && allyWard.team === 'blue') ||
                        (visionMode === 'red' && allyWard.team === 'red');
                    if (!isAllyControlWard) return false;

                    // Vérifier si la ward ennemie est dans le rayon de la Control Ward alliée
                    const dist = Math.sqrt((ward.x - allyWard.x) ** 2 + (ward.y - allyWard.y) ** 2);
                    return dist <= allyWard.visionRadius;
                });

                return revealedByControlWard;
            }

            // CAS 2: Control Wards ennemies visibles si elles désactivent une Vision Ward alliée
            if (ward.type === 'control') {
                const isDisablingAllyVisionWard = wardsWithDisabledStatus.some(allyWard => {
                    // Doit être une Vision Ward
                    if (allyWard.type !== 'vision') return false;
                    // Doit être alliée
                    const isAllyVisionWard =
                        (visionMode === 'blue' && allyWard.team === 'blue') ||
                        (visionMode === 'red' && allyWard.team === 'red');
                    if (!isAllyVisionWard) return false;
                    // Doit être désactivée
                    if (!allyWard.disabled) return false;

                    // Vérifier si cette Control Ward ennemie est celle qui désactive la Vision Ward alliée
                    const dist = Math.sqrt((ward.x - allyWard.x) ** 2 + (ward.y - allyWard.y) ** 2);
                    return dist <= ward.visionRadius;
                });

                return isDisablingAllyVisionWard;
            }

            return false;
        });
    }, [wardsWithDisabledStatus, visionMode]);

    return (
        <div className="w-screen h-screen bg-gray-900 text-white flex">
            
            <div className="w-64 bg-gray-800 p-4 flex flex-col gap-4 border-r border-gray-700 overflow-y-auto">
                <h2 className="text-xl font-bold">Map View</h2>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Zoom: {boardSize}px</label>
                    <input
                        type="range"
                        min="600"
                        max="949"
                        value={boardSize}
                        onChange={(e) => setBoardSize(Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`px-3 py-2 rounded transition-colors ${
                            showGrid
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {showGrid ? '✓ ' : ''}Show Grid
                    </button>

                    <button
                        onClick={() => setShowWalls(!showWalls)}
                        className={`px-3 py-2 rounded transition-colors ${
                            showWalls
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {showWalls ? '✓ ' : ''}Show Walls
                    </button>

                    <button
                        onClick={() => setShowBrush(!showBrush)}
                        className={`px-3 py-2 rounded transition-colors ${
                            showBrush
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {showBrush ? '✓ ' : ''}Show Brush
                    </button>
                </div>

                <hr className="border-gray-700" />

                <h3 className="text-lg font-bold">Fog of War</h3>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => toggleVisionMode('blue')}
                        className={`px-3 py-2 rounded transition-colors ${
                            visionMode === 'blue'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Blue Vision
                    </button>

                    <button
                        onClick={() => toggleVisionMode('red')}
                        className={`px-3 py-2 rounded transition-colors ${
                            visionMode === 'red'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Red Vision
                    </button>

                    <button
                        onClick={() => toggleVisionMode('both')}
                        className={`px-3 py-2 rounded transition-colors ${
                            visionMode === 'both'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Both Vision
                    </button>
                </div>

                {visionMode !== 'off' && (
                    <div className="text-xs text-gray-400">
                        Active mode: {visionMode} (click to disable)
                    </div>
                )}

                <hr className="border-gray-700" />

                <h3 className="text-lg font-bold">Drawing</h3>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setDrawMode(drawMode === 'pen' ? null : 'pen')}
                        className={`px-3 py-2 rounded transition-colors ${
                            drawMode === 'pen'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {drawMode === 'pen' ? '✓ ' : ''}Pen
                    </button>

                    <button
                        onClick={() => setDrawMode(drawMode === 'eraser' ? null : 'eraser')}
                        className={`px-3 py-2 rounded transition-colors ${
                            drawMode === 'eraser'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {drawMode === 'eraser' ? '✓ ' : ''}Eraser
                    </button>

                    <button
                        onClick={handleClearAllDrawings}
                        className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                    >
                        Clear All Drawings
                    </button>
                </div>

                {drawMode && (
                    <div className="text-xs text-yellow-400">
                        {drawMode === 'pen' ? 'Click and drag to draw' : 'Click on a drawing to erase'}
                    </div>
                )}
            </div>

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
                        wards={wardsWithDisabledStatus.filter(w => !w.disabled)}
                    />
                </div>
            </div>

            <div className="w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Wards</h2>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setSelectedTeam('blue')}
                        className={`flex-1 px-3 py-2 rounded transition-colors ${
                            selectedTeam === 'blue'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Blue
                    </button>
                    <button
                        onClick={() => setSelectedTeam('red')}
                        className={`flex-1 px-3 py-2 rounded transition-colors ${
                            selectedTeam === 'red'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Red
                    </button>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                    <button
                        onClick={() => setPlacingWard(placingWard === 'vision' ? null : 'vision')}
                        className={`px-3 py-2 rounded transition-colors ${
                            placingWard === 'vision'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {placingWard === 'vision' ? '✓ ' : ''}Vision Ward (Yellow)
                    </button>

                    <button
                        onClick={() => setPlacingWard(placingWard === 'control' ? null : 'control')}
                        className={`px-3 py-2 rounded transition-colors ${
                            placingWard === 'control'
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {placingWard === 'control' ? '✓ ' : ''}Control Ward (Pink)
                    </button>

                    <button
                        onClick={handleClearAllWards}
                        className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                    >
                        Clear All Wards
                    </button>
                </div>

                <div className="text-xs text-center mb-2">
                    <span className="text-blue-400">{wards.filter(w => w.team === 'blue').length} blue wards</span>
                    {' | '}
                    <span className="text-red-400">{wards.filter(w => w.team === 'red').length} red wards</span>
                </div>

                {placingWard && (
                    <div className="text-xs text-yellow-400 mb-4">
                        Left click on map to place
                    </div>
                )}

                <hr className="border-gray-700" />

                <div className="mt-4">
                    <h3 className="text-lg font-bold mb-2">Towers</h3>

                    <button
                        onClick={toggleAllTowers}
                        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded mb-3"
                    >
                        {towers.every(t => t.active) ? 'Disable All' : 'Enable All'}
                    </button>

                    <div className="text-xs text-center">
                        <span className="text-blue-400">{towers.filter(t => t.team === 'blue' && t.active).length} / {towers.filter(t => t.team === 'blue').length} blue</span>
                        {' | '}
                        <span className="text-red-400">{towers.filter(t => t.team === 'red' && t.active).length} / {towers.filter(t => t.team === 'red').length} red</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
