// Vision Mode Panel - Fog of War + Wards + Faelights
import type { VisionMode, WardType } from '../../types';
import { PanelSection } from '../ui/PanelSection';
import { ToggleButton } from '../ui/ToggleButton';
import { COLORS } from '../../constants/theme';

interface VisionModePanelProps {
    visionMode: VisionMode;
    onVisionModeToggle: (mode: 'blue' | 'red' | 'both') => void;
    selectedTeam: 'blue' | 'red';
    onSelectedTeamChange: (team: 'blue' | 'red') => void;
    placingWard: WardType | null;
    onPlacingWardChange: (type: WardType | null) => void;
    onClearAllWards: () => void;
    showFaelights: boolean;
    onShowFaelightsToggle: () => void;
    showEvolvedFaelights: boolean;
    onShowEvolvedFaelightsToggle: () => void;
}

export function VisionModePanel({
    visionMode,
    onVisionModeToggle,
    selectedTeam,
    onSelectedTeamChange,
    placingWard,
    onPlacingWardChange,
    onClearAllWards,
    showFaelights,
    onShowFaelightsToggle,
    showEvolvedFaelights,
    onShowEvolvedFaelightsToggle,
}: VisionModePanelProps) {
    function handleVisionWardClick() {
        onPlacingWardChange(placingWard === 'vision' ? null : 'vision');
    }

    function handleControlWardClick() {
        onPlacingWardChange(placingWard === 'control' ? null : 'control');
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            <PanelSection title="FOG OF WAR">
                <ToggleButton
                    label="Blue Vision"
                    isActive={visionMode === 'blue'}
                    onChange={() => onVisionModeToggle('blue')}
                    activeColor={COLORS.blue}
                />
                <ToggleButton
                    label="Red Vision"
                    isActive={visionMode === 'red'}
                    onChange={() => onVisionModeToggle('red')}
                    activeColor={COLORS.danger}
                />
                <ToggleButton
                    label="Both Vision"
                    isActive={visionMode === 'both'}
                    onChange={() => onVisionModeToggle('both')}
                    activeColor={COLORS.purple}
                />
            </PanelSection>

            <PanelSection title="WARDS">
                {/* Team Selection */}
                <div className="flex gap-2 mb-3">
                    <ToggleButton
                        label="Blue"
                        isActive={selectedTeam === 'blue'}
                        onChange={() => onSelectedTeamChange('blue')}
                        activeColor={COLORS.blue}
                        fullWidth={true}
                    />
                    <ToggleButton
                        label="Red"
                        isActive={selectedTeam === 'red'}
                        onChange={() => onSelectedTeamChange('red')}
                        activeColor={COLORS.danger}
                        fullWidth={true}
                    />
                </div>

                {/* Ward Types */}
                <ToggleButton
                    label="Vision Ward"
                    isActive={placingWard === 'vision'}
                    onChange={handleVisionWardClick}
                    activeColor={COLORS.gold}
                    showCheckmark={true}
                />
                <ToggleButton
                    label="Control Ward"
                    isActive={placingWard === 'control'}
                    onChange={handleControlWardClick}
                    activeColor={COLORS.pink}
                    showCheckmark={true}
                />
                <button
                    onClick={onClearAllWards}
                    className="px-4 py-2.5 text-sm font-medium transition-all border bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C] hover:bg-[#B86C6C]"
                >
                    Clear All Wards
                </button>
            </PanelSection>

            <PanelSection title="FAELIGHTS" showDivider={false}>
                <ToggleButton
                    label="Show"
                    isActive={showFaelights}
                    onChange={onShowFaelightsToggle}
                    activeColor={COLORS.primary}
                    showCheckmark={true}
                />
                {showFaelights && (
                    <ToggleButton
                        label="Evolved Map"
                        isActive={showEvolvedFaelights}
                        onChange={onShowEvolvedFaelightsToggle}
                        activeColor={COLORS.purple}
                        showCheckmark={true}
                    />
                )}
            </PanelSection>
        </div>
    );
}
