// View Mode Panel - Map View + Buildings + Jungle Camps
import { PanelSection } from '../ui/PanelSection';
import { ToggleButton } from '../ui/ToggleButton';
import { COLORS } from '../../constants/theme';

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
            <PanelSection title="MAP VIEW">
                <ToggleButton
                    label="Show Grid"
                    isActive={showGrid}
                    onChange={onShowGridToggle}
                    activeColor={COLORS.blue}
                    showCheckmark={true}
                />
                <ToggleButton
                    label="Show Walls"
                    isActive={showWalls}
                    onChange={onShowWallsToggle}
                    activeColor={COLORS.blue}
                    showCheckmark={true}
                />
                <ToggleButton
                    label="Show Bush"
                    isActive={showBrush}
                    onChange={onShowBrushToggle}
                    activeColor={COLORS.blue}
                    showCheckmark={true}
                />
                <ToggleButton
                    label="Show Coordinates"
                    isActive={showCoordinates}
                    onChange={onShowCoordinatesToggle}
                    activeColor={COLORS.blue}
                    showCheckmark={true}
                />
            </PanelSection>

            <PanelSection title="BUILDINGS">
                <ToggleButton
                    label="Show"
                    isActive={showTowers}
                    onChange={onShowTowersToggle}
                    activeColor={COLORS.blue}
                    showCheckmark={true}
                />
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
            </PanelSection>

            <PanelSection title="JUNGLE CAMPS" showDivider={false}>
                <ToggleButton
                    label="Show"
                    isActive={showJungleCamps}
                    onChange={onShowJungleCampsToggle}
                    activeColor={COLORS.blue}
                    showCheckmark={true}
                />
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
            </PanelSection>
        </div>
    );
}
