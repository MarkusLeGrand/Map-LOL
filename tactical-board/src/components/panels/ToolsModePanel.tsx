// Tools Mode Panel - Drawing + Export
import type { DrawMode } from '../../types';
import { ColorGradientPicker } from '../ui/ColorGradientPicker';
import { RangeSlider } from '../ui/RangeSlider';
import { PanelSection } from '../ui/PanelSection';
import { COLORS } from '../../constants/theme';

interface ToolsModePanelProps {
    drawMode: DrawMode;
    onDrawModeChange: (mode: DrawMode) => void;
    onClearAllDrawings: () => void;
    onExportToPNG: () => void;
    penColor: string;
    onPenColorChange: (color: string) => void;
    penWidth: number;
    onPenWidthChange: (width: number) => void;
}

export function ToolsModePanel({
    drawMode,
    onDrawModeChange,
    onClearAllDrawings,
    onExportToPNG,
    penColor,
    onPenColorChange,
    penWidth,
    onPenWidthChange,
}: ToolsModePanelProps) {
    function handlePenClick() {
        onDrawModeChange(drawMode === 'pen' ? null : 'pen');
    }

    function handleEraserClick() {
        onDrawModeChange(drawMode === 'eraser' ? null : 'eraser');
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            <PanelSection title="DRAWING">
                <button
                    onClick={handlePenClick}
                    className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                        drawMode === 'pen'
                            ? 'bg-[#3D7A5F] text-[#F5F5F5] border-[#3D7A5F]'
                            : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#3D7A5F]/50'
                    }`}
                >
                    {drawMode === 'pen' && '✓ '}Pen
                </button>

                {/* Pen Color Picker */}
                {drawMode === 'pen' && (
                    <ColorGradientPicker
                        value={penColor}
                        onChange={onPenColorChange}
                        label="COLOR"
                    />
                )}

                {/* Pen Width Slider */}
                {drawMode === 'pen' && (
                    <RangeSlider
                        label="SIZE"
                        value={penWidth}
                        min={1}
                        max={20}
                        onChange={onPenWidthChange}
                        unit="px"
                        color={COLORS.primary}
                    />
                )}

                <button
                    onClick={handleEraserClick}
                    className={`px-4 py-2.5 text-sm font-medium transition-all border ${
                        drawMode === 'eraser'
                            ? 'bg-[#B8945E] text-[#F5F5F5] border-[#B8945E]'
                            : 'bg-transparent text-[#F5F5F5]/60 border-[#F5F5F5]/10 hover:border-[#B8945E]/50'
                    }`}
                >
                    {drawMode === 'eraser' && '✓ '}Eraser
                </button>
                <button
                    onClick={onClearAllDrawings}
                    className="px-4 py-2.5 text-sm font-medium transition-all border bg-[#A85C5C] text-[#F5F5F5] border-[#A85C5C] hover:bg-[#B86C6C]"
                >
                    Clear All Drawings
                </button>
            </PanelSection>

            <PanelSection title="EXPORT" showDivider={false}>
                <button
                    onClick={onExportToPNG}
                    className="px-4 py-2.5 text-sm font-medium transition-all border bg-[#3D7A5F] text-[#F5F5F5] border-[#3D7A5F] hover:bg-[#4A9170]"
                >
                    Export to PNG
                </button>
            </PanelSection>
        </div>
    );
}
