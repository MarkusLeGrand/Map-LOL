import React from "react";

interface ViewPanelProps {
    showGrid: boolean;
    onToggleGrid: () => void;
}

export const ViewPanel: React.FC<ViewPanelProps> = ({ 
    showGrid, 
    onToggleGrid 
}) => {
    return (
        <div className="w-64 bg-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-xl font-bold mb-4">Vue</h2>

            <button 
                onClick={onToggleGrid}
                className={`w-full px-4 py-2 rounded-lg transition ${
                    showGrid 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-slate-700 hover:bg-slate-600"
                }`}
            >
                Grille {showGrid ? "ON" : "OFF"}
            </button>
        </div>
    );
};
