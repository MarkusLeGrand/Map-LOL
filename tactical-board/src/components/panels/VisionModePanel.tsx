// Vision Mode Panel - Fog of War + Wards + Faelights
import type { VisionMode, WardType } from '../../types';

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
            {/* Fog of War Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">FOG OF WAR</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onVisionModeToggle('blue')}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            visionMode === 'blue'
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        Blue Vision
                    </button>
                    <button
                        onClick={() => onVisionModeToggle('red')}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            visionMode === 'red'
                                ? 'bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#A85C5C]/50'
                        }`}
                    >
                        Red Vision
                    </button>
                    <button
                        onClick={() => onVisionModeToggle('both')}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            visionMode === 'both'
                                ? 'bg-[#7A5F8E] text-[#F5F5F5] border-[#7A5F8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#7A5F8E]/50'
                        }`}
                    >
                        Both Vision
                    </button>
                </div>
            </div>

            <div className="border-t border-[#F5F5F5]/10"></div>

            {/* Wards Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">WARDS</h3>

                {/* Team Selection */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => onSelectedTeamChange('blue')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all border ${
                            selectedTeam === 'blue'
                                ? 'bg-[#5F7A8E] text-[#F5F5F5] border-[#5F7A8E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#5F7A8E]/50'
                        }`}
                    >
                        Blue
                    </button>
                    <button
                        onClick={() => onSelectedTeamChange('red')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all border ${
                            selectedTeam === 'red'
                                ? 'bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#A85C5C]/50'
                        }`}
                    >
                        Red
                    </button>
                </div>

                {/* Ward Types */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleVisionWardClick}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            placingWard === 'vision'
                                ? 'bg-[#B8945E] text-[#F5F5F5] border-[#B8945E]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#B8945E]/50'
                        }`}
                    >
                        {placingWard === 'vision' && '✓ '}Vision Ward
                    </button>
                    <button
                        onClick={handleControlWardClick}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            placingWard === 'control'
                                ? 'bg-[#D97FB4] text-[#F5F5F5] border-[#D97FB4]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#D97FB4]/50'
                        }`}
                    >
                        {placingWard === 'control' && '✓ '}Control Ward
                    </button>
                    <button
                        onClick={onClearAllWards}
                        className="px-4 py-2.5 text-sm font-medium transition-all border bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C] hover:bg-[#B86C6C]"
                    >
                        Clear All Wards
                    </button>
                </div>
            </div>

            <div className="border-t border-[#F5F5F5]/10"></div>

            {/* Faelights Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">FAELIGHTS</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onShowFaelightsToggle}
                        className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                            showFaelights
                                ? 'bg-[#3D7A5F] text-[#F5F5F5] border-[#3D7A5F]'
                                : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#3D7A5F]/50'
                        }`}
                    >
                        {showFaelights && '✓ '}Show
                    </button>
                    {showFaelights && (
                        <button
                            onClick={onShowEvolvedFaelightsToggle}
                            className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                                showEvolvedFaelights
                                    ? 'bg-[#7A5F8E] text-[#F5F5F5] border-[#7A5F8E]'
                                    : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#7A5F8E]/50'
                            }`}
                        >
                            {showEvolvedFaelights && '✓ '}Evolved Map
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
