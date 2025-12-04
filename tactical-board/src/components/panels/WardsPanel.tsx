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

    const blueWardCount = wards.filter(w => w.team === 'blue').length;
    const redWardCount = wards.filter(w => w.team === 'red').length;

    const blueTowerCount = towers.filter(t => t.team === 'blue' && t.active).length;
    const totalBlueTowers = towers.filter(t => t.team === 'blue').length;
    const redTowerCount = towers.filter(t => t.team === 'red' && t.active).length;
    const totalRedTowers = towers.filter(t => t.team === 'red').length;

    const blueInhibitorCount = inhibitors.filter(i => i.team === 'blue' && i.active).length;
    const redInhibitorCount = inhibitors.filter(i => i.team === 'red' && i.active).length;

    const blueCampsCount = jungleCamps.filter(c => c.team === 'blue' && c.active).length;
    const totalBlueCamps = jungleCamps.filter(c => c.team === 'blue').length;
    const redCampsCount = jungleCamps.filter(c => c.team === 'red' && c.active).length;
    const totalRedCamps = jungleCamps.filter(c => c.team === 'red').length;
    const neutralCampsCount = jungleCamps.filter(c => c.team === 'neutral' && c.active).length;
    const totalNeutralCamps = jungleCamps.filter(c => c.team === 'neutral').length;

    return (
        <div className="w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Wards</h2>

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

            {placingWard && (
                <div className="text-xs text-yellow-400 mb-4">
                    Left click on map to place
                </div>
            )}

            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4">Buildings</h2>

            <div className="flex flex-col gap-2 mb-4">
                <Button onClick={onShowTowersToggle} variant="green" active={showTowers}>
                    {showTowers && '✓ '}Show
                </Button>

                <Button onClick={onToggleAllTowers} variant="danger">
                    Disable All
                </Button>
            </div>

            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4">Jungle Camps</h2>

            <div className="flex flex-col gap-2 mb-4">
                <Button onClick={onShowJungleCampsToggle} variant="green" active={showJungleCamps}>
                    {showJungleCamps && '✓ '}Show Jungle Camps
                </Button>

                <Button onClick={onToggleAllJungleCamps} variant="danger">
                    Disable All
                </Button>
            </div>

            <hr className="border-gray-700 mb-4" />

            <h2 className="text-xl font-bold mb-4">Game States</h2>

            <div className="bg-gray-900 rounded p-3 mb-4">
                <h3 className="text-sm font-bold mb-2 text-gray-300">Objectives</h3>

                <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Towers:</span>
                        <span>
                            <span className="text-blue-400">{blueTowerCount}/{totalBlueTowers}</span>
                            {' - '}
                            <span className="text-red-400">{redTowerCount}/{totalRedTowers}</span>
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-400">Inhibitors:</span>
                        <span>
                            <span className="text-blue-400">{blueInhibitorCount}/3</span>
                            {' - '}
                            <span className="text-red-400">{redInhibitorCount}/3</span>
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-400">Wards:</span>
                        <span>
                            <span className="text-blue-400">{blueWardCount}</span>
                            {' - '}
                            <span className="text-red-400">{redWardCount}</span>
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-400">Jungle Camps:</span>
                        <span>
                            <span className="text-blue-400">{blueCampsCount}/{totalBlueCamps}</span>
                            {' - '}
                            <span className="text-red-400">{redCampsCount}/{totalRedCamps}</span>
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-400">Neutral Objectives:</span>
                        <span className="text-purple-400">{neutralCampsCount}/{totalNeutralCamps}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
