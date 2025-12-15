// View Mode Panel - Map View + Buildings + Jungle Camps
interface ViewModePanelProps {
    showGrid: boolean;
    onShowGridToggle: () => void;
    showWalls: boolean;
    onShowWallsToggle: () => void;
    showBrush: boolean;
    onShowBrushToggle: () => void;
    showCoordinates: boolean;
    onShowCoordinatesToggle: () => void;
    showTowers: boolean;
    onShowTowersToggle: () => void;
    onToggleAllTowers: () => void;
    allTowersActive: boolean;
    showJungleCamps: boolean;
    onShowJungleCampsToggle: () => void;
    onToggleAllJungleCamps: () => void;
    allJungleCampsActive: boolean;
}

export function ViewModePanel({
    showGrid,
    onShowGridToggle,
    showWalls,
    onShowWallsToggle,
    showBrush,
    onShowBrushToggle,
    showCoordinates,
    onShowCoordinatesToggle,
    showTowers,
    onShowTowersToggle,
    onToggleAllTowers,
    allTowersActive,
    showJungleCamps,
    onShowJungleCampsToggle,
    onToggleAllJungleCamps,
    allJungleCampsActive,
}: ViewModePanelProps) {
    return (
        <div className="p-6 flex flex-col gap-6">
            {/* Map View Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">MAP VIEW</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onShowGridToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showGrid
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        {showGrid && '✓ '}Show Grid
                    </button>
                    <button
                        onClick={onShowWallsToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showWalls
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        {showWalls && '✓ '}Show Walls
                    </button>
                    <button
                        onClick={onShowBrushToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showBrush
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        {showBrush && '✓ '}Show Bush
                    </button>
                    <button
                        onClick={onShowCoordinatesToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showCoordinates
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        {showCoordinates && '✓ '}Show Coordinates
                    </button>
                </div>
            </div>

            <div className="border-t border-[#F5F5F5]/10"></div>

            {/* Buildings Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">BUILDINGS</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onShowTowersToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showTowers
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        {showTowers && '✓ '}Show
                    </button>
                    <button
                        onClick={onToggleAllTowers}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            allTowersActive
                                ? 'bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C] hover:bg-[#B86C6C]'
                                : 'bg-[#3D7A5F] text-[#F5F5F5] border-[#3D7A5F] hover:bg-[#4A9170]'
                        }`}
                    >
                        {allTowersActive ? 'Disable All' : 'Enable All'}
                    </button>
                </div>
            </div>

            <div className="border-t border-[#F5F5F5]/10"></div>

            {/* Jungle Camps Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">JUNGLE CAMPS</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onShowJungleCampsToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showJungleCamps
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        {showJungleCamps && '✓ '}Show
                    </button>
                    <button
                        onClick={onToggleAllJungleCamps}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            allJungleCampsActive
                                ? 'bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C] hover:bg-[#B86C6C]'
                                : 'bg-[#3D7A5F] text-[#F5F5F5] border-[#3D7A5F] hover:bg-[#4A9170]'
                        }`}
                    >
                        {allJungleCampsActive ? 'Disable All' : 'Enable All'}
                    </button>
                </div>
            </div>
        </div>
    );
}
