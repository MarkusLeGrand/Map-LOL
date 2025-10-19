import React from "react";

const AnnotationPanel = ({ tool, setTool, clearDrawings, hasDrawings }) => {
  const drawModeIs = (mode) => tool.type === "draw" && tool.mode === mode;

  return (
    <aside className="w-full lg:w-72 flex-none space-y-4">
      <div className="rounded-2xl bg-slate-800/70 p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Annotation</h2>

        <div className="space-y-2">
          <div className="text-sm uppercase tracking-wide text-slate-400">Outils</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTool((prev) => ({ ...prev, type: "draw", mode: "pen" }))}
              className={`px-3 py-2 rounded-xl shadow ${
                drawModeIs("pen") ? "bg-emerald-600" : "bg-slate-700"
              }`}
            >
              🖊️ Stylo
            </button>
            <button
              onClick={() => setTool((prev) => ({ ...prev, type: "draw", mode: "eraser" }))}
              className={`px-3 py-2 rounded-xl shadow ${
                drawModeIs("eraser") ? "bg-rose-600" : "bg-slate-700"
              }`}
            >
              🧽 Gomme
            </button>
          </div>
        </div>

        {typeof clearDrawings === "function" && (
          <button
            type="button"
            onClick={clearDrawings}
            className={`mt-4 w-full px-3 py-2 rounded-xl ${
              hasDrawings ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-800 cursor-not-allowed"
            }`}
            disabled={!hasDrawings}
          >
            Effacer les dessins
          </button>
        )}
      </div>
    </aside>
  );
};

export default AnnotationPanel;
