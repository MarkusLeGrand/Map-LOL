import { Button } from '../ui/Button';
import type { WardType, Ward, Tower, JungleCamp, Inhibitor } from '../../types';

interface WardsPanelProps {
    selectedTeam: 'blue' | 'red';
    onSelectedTeamChange: (team: 'blue' | 'red') => void;
    placingWard: WardType | null;
    onPlacingWardChange: (type: WardType | null) => void;
    wards: Ward[];
    onClearAllWards: () => void;
    towers: Tower[];
    onToggleAllTowers: () => void;
    jungleCamps: JungleCamp[];
    onToggleAllJungleCamps: () => void;
    inhibitors: Inhibitor[];
    showTowers: boolean;
    onShowTowersToggle: () => void;
    showJungleCamps: boolean;
    onShowJungleCampsToggle: () => void;
    showFaelights: boolean;
    onShowFaelightsToggle: () => void;
    showEvolvedFaelights: boolean;
    onShowEvolvedFaelightsToggle: () => void;
}

export function WardsPanel({
    selectedTeam,
    onSelectedTeamChange,
    placingWard,
    onPlacingWardChange,
    wards,
    onClearAllWards,
    towers,
    onToggleAllTowers,
    jungleCamps,
    onToggleAllJungleCamps,
    inhibitors,
    showTowers,
    onShowTowersToggle,
    showJungleCamps,
    onShowJungleCampsToggle,
    showFaelights,
    onShowFaelightsToggle,
    showEvolvedFaelights,
    onShowEvolvedFaelightsToggle,
}: WardsPanelProps) {
    function handleVisionWardClick() {
        if (placingWard === 'vision') {
            onPlacingWardChange(null);
        } else {
            onPlacingWardChange('vision');
        }
    }

    function handleControlWardClick() {
        if (placingWard === 'control') {
            onPlacingWardChange(null);
        } else {
            onPlacingWardChange('control');
        }
    }

    // Game status counts - kept for future use when Game Status section is re-enabled
    // const blueWardCount = wards.filter(w => w.team === 'blue').length;
    // const redWardCount = wards.filter(w => w.team === 'red').length;
    // const blueTowerCount = towers.filter(t => t.team === 'blue' && t.active).length;
    // const totalBlueTowers = towers.filter(t => t.team === 'blue').length;
    // const redTowerCount = towers.filter(t => t.team === 'red' && t.active).length;
    // const totalRedTowers = towers.filter(t => t.team === 'red').length;
    // const blueInhibitorCount = inhibitors.filter(i => i.team === 'blue' && i.active).length;
    // const redInhibitorCount = inhibitors.filter(i => i.team === 'red' && i.active).length;
    // const blueCampsCount = jungleCamps.filter(c => c.team === 'blue' && c.active).length;
    // const totalBlueCamps = jungleCamps.filter(c => c.team === 'blue').length;
    // const redCampsCount = jungleCamps.filter(c => c.team === 'red' && c.active).length;
    // const totalRedCamps = jungleCamps.filter(c => c.team === 'red').length;
    // const neutralCampsCount = jungleCamps.filter(c => c.team === 'neutral' && c.active).length;
    // const totalNeutralCamps = jungleCamps.filter(c => c.team === 'neutral').length;

    const allTowersAndInhibitorsActive = towers.every(t => t.active) && inhibitors.every(i => i.active);
    const allJungleCampsActive = jungleCamps.every(c => c.active);

    return (
        <div className="w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Wards</h2>

            <div className="flex gap-2 mb-4">
                <Button
                    onClick={() => onSelectedTeamChange('blue')}
                    variant="blue"
                    active={selectedTeam === 'blue'}
                    className="flex-1"
                >
                    Blue
                </Button>
                <Button
                    onClick={() => onSelectedTeamChange('red')}
                    variant="red"
                    active={selectedTeam === 'red'}
                    className="flex-1"
                >
                    Red
                </Button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
                <Button onClick={handleVisionWardClick} variant="yellow" active={placingWard === 'vision'}>
                    {placingWard === 'vision' && '✓ '}Vision Ward
                </Button>

                <Button onClick={handleControlWardClick} variant="pink" active={placingWard === 'control'}>
                    {placingWard === 'control' && '✓ '}Control Ward
                </Button>

                <Button onClick={onClearAllWards} variant="danger">
                    Clear All Wards
                </Button>
            </div>

            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4 text-center">Buildings</h2>

            <div className="flex flex-col gap-2 mb-4">
                <Button onClick={onShowTowersToggle} variant="green" active={showTowers}>
                    {showTowers && '✓ '}Show
                </Button>

                <button
                    onClick={onToggleAllTowers}
                    className={`px-3 py-2 rounded transition-colors text-white ${
                        allTowersAndInhibitorsActive
                            ? 'bg-red-800 hover:bg-red-900'
                            : 'bg-green-700'
                    }`}
                >
                    {allTowersAndInhibitorsActive ? 'Disable All' : 'Enable All'}
                </button>
            </div>

            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4 text-center">Jungle Camps</h2>

            <div className="flex flex-col gap-2 mb-4">
                <Button onClick={onShowJungleCampsToggle} variant="green" active={showJungleCamps}>
                    {showJungleCamps && '✓ '}Show Jungle Camps
                </Button>

                <button
                    onClick={onToggleAllJungleCamps}
                    className={`px-3 py-2 rounded transition-colors text-white ${
                        allJungleCampsActive
                            ? 'bg-red-800 hover:bg-red-900'
                            : 'bg-green-700'
                    }`}
                >
                    {allJungleCampsActive ? 'Disable All' : 'Enable All'}
                </button>
            </div>

            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4 text-center">Faelights</h2>

            <div className="flex flex-col gap-2 mb-4">
                <Button onClick={onShowFaelightsToggle} variant="green" active={showFaelights}>
                    {showFaelights && '✓ '}Show
                </Button>

                {showFaelights && (
                    <Button onClick={onShowEvolvedFaelightsToggle} variant="purple" active={showEvolvedFaelights}>
                        {showEvolvedFaelights && '✓ '}Evolved Map
                    </Button>
                )}
            </div>

            {/* Game Status - Kept for future use
            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4 text-center">Game Status</h2>

            <div className="bg-gray-900 rounded overflow-hidden mb-4">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left p-2 text-gray-400 font-semibold"></th>
                            <th className="text-center p-2 text-blue-400 font-semibold">Blue</th>
                            <th className="text-center p-2 text-red-400 font-semibold">Red</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-gray-800">
                            <td className="p-2 text-gray-400">Towers</td>
                            <td className="p-2 text-center text-blue-400">{blueTowerCount}/{totalBlueTowers}</td>
                            <td className="p-2 text-center text-red-400">{redTowerCount}/{totalRedTowers}</td>
                        </tr>
                        <tr className="border-b border-gray-800">
                            <td className="p-2 text-gray-400">Inhibitors</td>
                            <td className="p-2 text-center text-blue-400">{blueInhibitorCount}/3</td>
                            <td className="p-2 text-center text-red-400">{redInhibitorCount}/3</td>
                        </tr>
                        <tr className="border-b border-gray-800">
                            <td className="p-2 text-gray-400">Wards</td>
                            <td className="p-2 text-center text-blue-400">{blueWardCount}</td>
                            <td className="p-2 text-center text-red-400">{redWardCount}</td>
                        </tr>
                        <tr className="border-b border-gray-800">
                            <td className="p-2 text-gray-400">Jungle</td>
                            <td className="p-2 text-center text-blue-400">{blueCampsCount}/{totalBlueCamps}</td>
                            <td className="p-2 text-center text-red-400">{redCampsCount}/{totalRedCamps}</td>
                        </tr>
                        <tr>
                            <td className="p-2 text-gray-400">Neutral</td>
                            <td className="p-2 text-center text-purple-400" colSpan={2}>{neutralCampsCount}/{totalNeutralCamps}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            */}
        </div>
    );
}
