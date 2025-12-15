// Tools Mode Panel - Drawing + Export
import type { DrawMode } from '../../types';

interface ToolsModePanelProps {
    drawMode: DrawMode;
    onDrawModeChange: (mode: DrawMode) => void;
    onClearAllDrawings: () => void;
    onExportToPNG: () => void;
}

export function ToolsModePanel({
    drawMode,
    onDrawModeChange,
    onClearAllDrawings,
    onExportToPNG,
}: ToolsModePanelProps) {
    function handlePenClick() {
        onDrawModeChange(drawMode === 'pen' ? null : 'pen');
    }

    function handleEraserClick() {
        onDrawModeChange(drawMode === 'eraser' ? null : 'eraser');
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            {/* Drawing Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">DRAWING</h3>
                <div className="flex flex-col gap-2">
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
                </div>
            </div>

            <div className="border-t border-[#F5F5F5]/10"></div>

            {/* Export Section */}
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">EXPORT</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onExportToPNG}
                        className="px-4 py-2.5 text-sm font-medium transition-all border bg-[#3D7A5F] text-[#F5F5F5] border-[#3D7A5F] hover:bg-[#4A9170]"
                    >
                        Export to PNG
                    </button>
                </div>
            </div>
        </div>
    );
}
