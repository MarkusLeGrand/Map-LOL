import { Button } from '../ui/Button';
import type { WardType, Ward, Tower } from '../../types';

interface WardsPanelProps {
    selectedTeam: 'blue' | 'red';
    onSelectedTeamChange: (team: 'blue' | 'red') => void;
    placingWard: WardType | null;
    onPlacingWardChange: (type: WardType | null) => void;
    wards: Ward[];
    onClearAllWards: () => void;
    towers: Tower[];
    onToggleAllTowers: () => void;
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

    const allTowersActive = towers.every(t => t.active);
    const towerButtonText = allTowersActive ? 'Disable All' : 'Enable All';

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

            <div className="text-xs text-center mb-2">
                <span className="text-blue-400">{blueWardCount} blue wards</span>
                {' | '}
                <span className="text-red-400">{redWardCount} red wards</span>
            </div>

            {placingWard && (
                <div className="text-xs text-yellow-400 mb-4">
                    Left click on map to place
                </div>
            )}

            <hr className="border-gray-700" />

            <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">Towers</h3>

                <Button onClick={onToggleAllTowers} variant="purple" fullWidth className="mb-3">
                    {towerButtonText}
                </Button>

                <div className="text-xs text-center">
                    <span className="text-blue-400">{blueTowerCount} / {totalBlueTowers} blue</span>
                    {' | '}
                    <span className="text-red-400">{redTowerCount} / {totalRedTowers} red</span>
                </div>
            </div>
        </div>
    );
}
