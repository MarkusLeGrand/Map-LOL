import React from "react";

const ControlPanel = ({
  visionSide,
  setVisionSide,
  tool,
  setTool,
  bgUrl,
  setBgUrl,
  showGrid,
  setShowGrid,
  showWalls,
  setShowWalls,
  showBrush,
  setShowBrush,
  editTowers,
  setEditTowers,
  saveBoardState,
  setAllTowersEnabled,
  clearWards,
  exportState,
  importState,
}) => {
  const toolIs = (type) => tool.type === type;

  return (
    <aside className="col-span-12 lg:col-span-3 space-y-4">
      <div className="rounded-2xl bg-slate-800/70 p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Contrôles</h2>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setVisionSide("blue")}
            className={`px-3 py-2 rounded-xl shadow ${
              visionSide === "blue" ? "bg-blue-500 text-white" : "bg-slate-700"
            }`}
          >
            Vision Blue
          </button>
          <button
            onClick={() => setVisionSide("red")}
            className={`px-3 py-2 rounded-xl shadow ${
              visionSide === "red" ? "bg-rose-500 text-white" : "bg-slate-700"
            }`}
          >
            Vision Red
          </button>
          <button
            onClick={() => setVisionSide("global")}
            className={`px-3 py-2 rounded-xl shadow ${
              visionSide === "global" ? "bg-purple-600 text-white" : "bg-slate-700"
            }`}
          >
            Vision Globale
          </button>
          <button
            onClick={() => setVisionSide("both")}
            className={`px-3 py-2 rounded-xl shadow ${
              visionSide === "both" ? "bg-violet-500 text-white" : "bg-slate-700"
            }`}
          >
            Vision Red/Blue
          </button>
        </div>

        <div className="h-px bg-slate-700 my-3" />

        <div className="space-y-2">
          <div className="text-sm uppercase tracking-wide text-slate-400">Outils</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTool({ type: "select", team: tool.team, ward: tool.ward })}
              className={`px-3 py-2 rounded-xl shadow ${toolIs("select") ? "bg-slate-600" : "bg-slate-700"}`}
            >
              Sélection / Déplacement
            </button>
            <button
              onClick={() => setTool({ type: "ward", team: "blue", ward: tool.ward })}
              className={`px-3 py-2 rounded-xl shadow ${
                toolIs("ward") && tool.team === "blue" ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              Ward Blue
            </button>
            <button
              onClick={() => setTool({ type: "ward", team: "red", ward: tool.ward })}
              className={`px-3 py-2 rounded-xl shadow ${
                toolIs("ward") && tool.team === "red" ? "bg-rose-600" : "bg-slate-700"
              }`}
            >
              Ward Red
            </button>
          </div>
          <button onClick={clearWards} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Clear wards
          </button>

        </div>

        <div className="h-px bg-slate-700 my-3" />

        <div className="space-y-2">
          <div className="text-sm uppercase tracking-wide text-slate-400">Carte</div>
          <input
            className="w-full px-3 py-2 rounded-xl bg-slate-700 placeholder:text-slate-400"
            placeholder="URL d'image (optionnel)"
            value={bgUrl}
            onChange={(e) => setBgUrl(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            Afficher la grille
          </label>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showWalls} onChange={(e) => setShowWalls(e.target.checked)} />
              Voir mask Walls
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showBrush} onChange={(e) => setShowBrush(e.target.checked)} />
              Voir mask Brush
            </label>
          </div>
        </div>

        <div className="h-px bg-slate-700 my-3" />

        <div className="space-y-2">
          <div className="text-sm uppercase tracking-wide text-slate-400">Editeur</div>
          <div className="flex gap-2 flex-wrap">
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setEditTowers((v) => !v)}
              className={`px-3 py-2 rounded-xl ${editTowers ? "bg-amber-600" : "bg-slate-700"}`}
            >
              {editTowers ? "Quitter édition" : "Éditer"}
            </button>
            <button onClick={saveBoardState} className="px-3 py-2 rounded-xl bg-slate-700">
              Enregistrer
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Cliquer une tour: activer/désactiver. En mode édition: glisser pour repositionner (puis “Enregistrer”).
          </p>
        </div>

        <div className="h-px bg-slate-700 my-3" />

        <div className="flex flex-wrap gap-2">
          <button onClick={exportState} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Exporter
          </button>
          <button onClick={importState} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Importer
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ControlPanel;
