import { useState } from "react";
import { MapBoard } from "./components/MapBoard";
import { defaultTokens } from "./data/defaultTokens";
import { defaultTowers } from "./data/defaultTowers";
import type { Token, Tower } from "./types";

export default function App() {
    const [boardSize, setBoardSize] = useState(800);
    const [showGrid, setShowGrid] = useState(true);
    const [tokens, setTokens] = useState<Token[]>(defaultTokens);
    const [towers, setTowers] = useState<Tower[]>(defaultTowers);
    const [showWalls, setShowWalls] = useState(false);
    const [showBrush, setShowBrush] = useState(false);
    
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

    return (
        <div className="w-screen h-screen bg-gray-900 text-white flex">
            
            <div className="w-64 bg-gray-800 p-4 flex flex-col gap-4 border-r border-gray-700 overflow-y-auto">
                <h2 className="text-xl font-bold">Vue de la map</h2>
                
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Zoom: {boardSize}px</label>
                    <input 
                        type="range" 
                        min="600" 
                        max="1000" 
                        value={boardSize}
                        onChange={(e) => setBoardSize(Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span>Afficher grille</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showWalls}
                        onChange={(e) => setShowWalls(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span>Afficher murs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showBrush}
                        onChange={(e) => setShowBrush(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span>Afficher herbes</span>
                </label>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <MapBoard 
                    boardSize={boardSize}
                    showGrid={showGrid}
                    gridSize={GRID}
                    tokens={tokens}
                    towers={towers}
                    onTokenMove={handleTokenMove}
                    onTowerToggle={handleTowerToggle}
                    showWalls={showWalls}
                    showBrush={showBrush}
                    showTowers={true}
                />
            </div>

            <div className="w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Joueurs</h2>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="text-blue-400 font-semibold mb-2">Equipe Bleue</h3>
                        <div className="space-y-2">
                            {tokens.filter(t => t.team === 'blue').map(token => (
                                <div key={token.id} className="bg-gray-700 p-2 rounded text-sm">
                                    <div className="font-semibold">{token.role}</div>
                                    <div className="text-gray-400 text-xs">
                                        Grid: ({(token.x * GRID).toFixed(1)}, {(token.y * GRID).toFixed(1)})
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-red-400 font-semibold mb-2">Equipe Rouge</h3>
                        <div className="space-y-2">
                            {tokens.filter(t => t.team === 'red').map(token => (
                                <div key={token.id} className="bg-gray-700 p-2 rounded text-sm">
                                    <div className="font-semibold">{token.role}</div>
                                    <div className="text-gray-400 text-xs">
                                        Grid: ({(token.x * GRID).toFixed(1)}, {(token.y * GRID).toFixed(1)})
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="border-gray-700" />

                    <div>
                        <h3 className="text-lg font-bold mb-2">Tours</h3>
                        
                        <button
                            onClick={toggleAllTowers}
                            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded mb-3"
                        >
                            {towers.every(t => t.active) ? 'Desactiver toutes' : 'Activer toutes'}
                        </button>

                        <div className="space-y-1 text-sm">
                            <div className="text-blue-400">
                                Bleu: {towers.filter(t => t.team === 'blue' && t.active).length} / {towers.filter(t => t.team === 'blue').length}
                            </div>
                            <div className="text-red-400">
                                Rouge: {towers.filter(t => t.team === 'red' && t.active).length} / {towers.filter(t => t.team === 'red').length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
