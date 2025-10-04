import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================
   CONFIG
========================= */
const MAX_BOARD = 1100;
const LSK_TOWERS = "lolboard_towers_v1";
const LSK_STATE = "lolboard_state_v1";

const wardRadius = { stealth: 260, control: 300, trap: 220 };
const DEFAULT_TOWER_RADIUS = 750;

/* =========================
   UTILS (images & samplers)
========================= */
function useImage(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) return;
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.onerror = () => setImg(null);
    i.src = src;
  }, [src]);
  return img;
}

function useSampler(img) {
  return useMemo(() => {
    if (!img) return null;
    const cvs = document.createElement("canvas");
    const w = (cvs.width = img.width);
    const h = (cvs.height = img.height);
    const ctx = cvs.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    return (x, y, board) => {
      const u = Math.max(0, Math.min(w - 1, Math.round((x / board) * w)));
      const v = Math.max(0, Math.min(h - 1, Math.round((y / board) * h)));
      const o = (v * w + u) * 4;
      return data[o]; // canal R (0..255)
    };
  }, [img]);
}

/* =========================
   DEFAULTS
========================= */
const defaultTowersNormalized = [
  // (positions approx — recale avec "Éditer les tours" puis Enregistrer)
  { id: "B_t1_bot", team: "blue", x: 0.18, y: 0.88, enabled: true },
  { id: "B_t2_bot", team: "blue", x: 0.26, y: 0.80, enabled: true },
  { id: "B_t3_bot", team: "blue", x: 0.33, y: 0.73, enabled: true },
  { id: "B_inhib_bot", team: "blue", x: 0.39, y: 0.66, enabled: true },
  { id: "B_nexus_1", team: "blue", x: 0.08, y: 0.93, enabled: true },
  { id: "B_nexus_2", team: "blue", x: 0.12, y: 0.90, enabled: true },

  { id: "B_t1_mid", team: "blue", x: 0.20, y: 0.74, enabled: true },
  { id: "B_t2_mid", team: "blue", x: 0.28, y: 0.66, enabled: true },
  { id: "B_t3_mid", team: "blue", x: 0.36, y: 0.58, enabled: true },
  { id: "B_inhib_mid", team: "blue", x: 0.43, y: 0.51, enabled: true },

  { id: "B_t1_top", team: "blue", x: 0.12, y: 0.68, enabled: true },
  { id: "B_t2_top", team: "blue", x: 0.19, y: 0.60, enabled: true },
  { id: "B_t3_top", team: "blue", x: 0.27, y: 0.52, enabled: true },
  { id: "B_inhib_top", team: "blue", x: 0.34, y: 0.45, enabled: true },

  { id: "R_t1_bot", team: "red", x: 0.72, y: 0.27, enabled: true },
  { id: "R_t2_bot", team: "red", x: 0.79, y: 0.19, enabled: true },
  { id: "R_t3_bot", team: "red", x: 0.87, y: 0.12, enabled: true },
  { id: "R_inhib_bot", team: "red", x: 0.61, y: 0.34, enabled: true },
  { id: "R_nexus_1", team: "red", x: 0.92, y: 0.08, enabled: true },
  { id: "R_nexus_2", team: "red", x: 0.90, y: 0.12, enabled: true },

  { id: "R_t1_mid", team: "red", x: 0.66, y: 0.20, enabled: true },
  { id: "R_t2_mid", team: "red", x: 0.74, y: 0.28, enabled: true },
  { id: "R_t3_mid", team: "red", x: 0.82, y: 0.36, enabled: true },
  { id: "R_inhib_mid", team: "red", x: 0.49, y: 0.43, enabled: true },

  { id: "R_t1_top", team: "red", x: 0.60, y: 0.12, enabled: true },
  { id: "R_t2_top", team: "red", x: 0.68, y: 0.19, enabled: true },
  { id: "R_t3_top", team: "red", x: 0.76, y: 0.27, enabled: true },
  { id: "R_inhib_top", team: "red", x: 0.55, y: 0.39, enabled: true },
];

const defaultTokens = (S) => {
  const pad = 0.07 * S;
  const blue = [
    { x: pad, y: S - pad },
    { x: pad + 60, y: S - pad - 60 },
    { x: pad + 120, y: S - pad - 10 },
    { x: pad + 30, y: S - pad - 120 },
    { x: pad + 90, y: S - pad - 180 },
  ];
  const red = [
    { x: S - pad, y: pad },
    { x: S - pad - 60, y: pad + 60 },
    { x: S - pad - 120, y: pad + 10 },
    { x: S - pad - 30, y: pad + 120 },
    { x: S - pad - 90, y: pad + 180 },
  ];
  return [
    ...blue.map((p, i) => ({ id: `B${i + 1}`, team: "blue", ...p })),
    ...red.map((p, i) => ({ id: `R${i + 1}`, team: "red", ...p })),
  ];
};

/* =========================
   APP
========================= */
export default function TacticalBoard() {
  // sizing responsive & carré
  const containerRef = useRef(null);
  const boardRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const lastFogDataRef = useRef(null);
  const rafRef = useRef(0);

  const [boardSize, setBoardSize] = useState(900);
  const [visionSide, setVisionSide] = useState("blue");
  const [tool, setTool] = useState({ type: "select", team: "blue", ward: "stealth" });
  const [bgUrl, setBgUrl] = useState("/sr.jpg");
  const [showGrid, setShowGrid] = useState(false);

  const [tokens, setTokens] = useState(() => defaultTokens(900));
  const [wards, setWards] = useState([]);
  const [towers, setTowers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LSK_TOWERS));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return defaultTowersNormalized;
  });

  const [editTowers, setEditTowers] = useState(false);
  const [towerVisionRadius, setTowerVisionRadius] = useState(DEFAULT_TOWER_RADIUS);
  const [tokenVisionRadius, setTokenVisionRadius] = useState(320); // réduit par défaut

  // drag refs
  const dragRef = useRef({ id: null, dx: 0, dy: 0, isDup: false });
  const dragTowerRef = useRef({ id: null });

  // LOS masks
  const wallsImg = useImage("/masks/walls.png");
  const brushImg = useImage("/masks/brush.png");
  const sampleWalls = useSampler(wallsImg);
  const sampleBrush = useSampler(brushImg);

  // responsive square
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setBoardSize(Math.min(w, MAX_BOARD));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // batch redraw fog on deps (perf)
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawFog);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tokens, wards, towers, visionSide, bgUrl, showGrid, boardSize,
    wallsImg, brushImg, towerVisionRadius, tokenVisionRadius
  ]);

  /* ============ FOG OF WAR (LoL) ============ */
  function drawFog() {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = boardSize;
    canvas.height = boardSize;

    if (visionSide === "off") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastFogDataRef.current = null;
      return;
    }

    // Si pas de walls.png → pas de triche : tout sombre
    if (!sampleWalls) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, boardSize, boardSize);
      lastFogDataRef.current = ctx.getImageData(0, 0, boardSize, boardSize);
      return;
    }

    // Overlay noir à creuser
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.64)"; // un peu plus doux
    ctx.fillRect(0, 0, boardSize, boardSize);

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 14;

    // voisinage 3×3 : évite que le rayon saute un trait fin
    const isBlocked = (x, y) => {
      const s = 1;
      for (let oy = -s; oy <= s; oy++) {
        for (let ox = -s; ox <= s; ox++) {
          if (sampleWalls(x + ox, y + oy, boardSize) > 128) return true;
        }
      }
      return false;
    };

    // Ray casting adaptatif (fluide & propre)
    const los = (cx, cy, r) => {
      const RAYS = 512;                 // 512 directions
      const stepDeg = 360 / RAYS;
      for (let i = 0; i < RAYS; i++) {
        const ang = i * stepDeg;
        const rad = (ang * Math.PI) / 180;
        let lastX = cx, lastY = cy;

        for (let d = 0; d <= r; ) {
          const x = cx + Math.cos(rad) * d;
          const y = cy + Math.sin(rad) * d;

          if (isBlocked(x, y)) {
            // “ferme” proprement la dernière portion
            const nx = cx + Math.cos(rad) * Math.max(0, d - 1);
            const ny = cy + Math.sin(rad) * Math.max(0, d - 1);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(nx, ny);
            ctx.stroke();
            break;
          }

          // creuse le brouillard
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();

          lastX = x; lastY = y;

          // pas de distance adaptatif (moins de points loin)
          d += d < 200 ? 2 : d < 400 ? 3 : 4;
        }
      }
    };

    // tours (de l'équipe sélectionnée & activées)
    towers.filter(t => t.team === visionSide && t.enabled).forEach(t => {
      los(t.x * boardSize, t.y * boardSize, towerVisionRadius);
    });
    // champions alliés
    tokens.filter(t => t.team === visionSide).forEach(t => {
      los(t.x, t.y, tokenVisionRadius);
    });
    // wards alliées
    wards.filter(w => w.team === visionSide).forEach(w => {
      los(w.x, w.y, wardRadius[w.kind] || 250);
    });

    // snapshot pour visibilité
    lastFogDataRef.current = ctx.getImageData(0, 0, boardSize, boardSize);
    ctx.globalCompositeOperation = "source-over";
  }

  // helpers visibility & bush
  function isVisibleOnCurrentFog(x, y) {
    const img = lastFogDataRef.current;
    if (!img) return false;
    const ix = Math.max(0, Math.min(boardSize - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(boardSize - 1, Math.round(y)));
    const o = (iy * boardSize + ix) * 4;
    const alpha = img.data[o + 3]; // trou = alpha ≈ 0
    return alpha < 10;
  }

  // sample du brush plus robuste : centre + 4 offsets
  function inBrushArea(x, y) {
    if (!sampleBrush) return false;
    const offs = [[0,0],[8,0],[-8,0],[0,8],[0,-8]];
    for (const [ox,oy] of offs) {
      if (sampleBrush(x+ox, y+oy, boardSize) > 128) return true;
    }
    return false;
  }

  function allyRevealsBush(x, y, viewerTeam) {
    // ward ALLIÉE ou champion ALLIÉ dans le même bush (proche)
    const wardReveals = wards.some(
      w => w.team === viewerTeam && inBrushArea(w.x, w.y) && Math.hypot(w.x - x, w.y - y) < 260
    );
    const allyInBush = tokens.some(
      a => a.team === viewerTeam && inBrushArea(a.x, a.y) && Math.hypot(a.x - x, a.y - y) < 220
    );
    return wardReveals || allyInBush;
  }

  /* ============ WARDS & TOKENS & TOWERS ============ */
  const toolIs = (t) => tool.type === t;

  function boardPosFromEvent(e) {
    const rect = boardRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(boardSize, clientX - rect.left)),
      y: Math.max(0, Math.min(boardSize, clientY - rect.top)),
    };
  }

  function onBoardClick(e) {
    const p = boardPosFromEvent(e);
    if (tool.type === "ward") {
      setWards((ws) => [
        ...ws,
        { id: crypto.randomUUID(), team: tool.team, kind: tool.ward, x: p.x, y: p.y },
      ]);
    }
  }
  function onBoardAltClick(e) {
    if (!e.altKey) return;
    const p = boardPosFromEvent(e);
    setWards((ws) => {
      if (!ws.length) return ws;
      let bestIdx = -1, bestD = 1e9;
      ws.forEach((w, i) => {
        const d = Math.hypot(w.x - p.x, w.y - p.y);
        if (d < bestD) { bestD = d; bestIdx = i; }
      });
      if (bestD <= 30) { const copy = [...ws]; copy.splice(bestIdx, 1); return copy; }
      return ws;
    });
  }

  function beginDragToken(e, id) {
    const p = boardPosFromEvent(e);
    const t = tokens.find((tk) => tk.id === id);
    dragRef.current = { id, dx: t.x - p.x, dy: t.y - p.y, isDup: e.shiftKey };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("mouseup", endDragToken);
    window.addEventListener("touchend", endDragToken);
  }
  function onDragMove(e) {
    if (!dragRef.current.id) return;
    if (e.cancelable) e.preventDefault();
    const p = boardPosFromEvent(e);
    const { dx, dy, id } = dragRef.current;
    setTokens((arr) => arr.map((t) => (t.id === id ? { ...t, x: p.x + dx, y: p.y + dy } : t)));
  }
  function endDragToken() {
    const drag = dragRef.current;
    if (!drag.id) return;
    if (drag.isDup) {
      setTokens((arr) => {
        const src = arr.find((t) => t.id === drag.id);
        const copy = { ...src, id: `${src.id}-${Math.floor(Math.random() * 999)}` };
        return [...arr, copy];
      });
    }
    dragRef.current = { id: null, dx: 0, dy: 0, isDup: false };
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("mouseup", endDragToken);
    window.removeEventListener("touchend", endDragToken);
  }

  function toggleTowerEnable(tid) {
    setTowers((arr) => arr.map((t) => (t.id === tid ? { ...t, enabled: !t.enabled } : t)));
  }
  function beginDragTower(e, tid) {
    if (!editTowers) return;
    e.stopPropagation();
    dragTowerRef.current = { id: tid };
    window.addEventListener("mousemove", onDragMoveTower);
    window.addEventListener("mouseup", endDragTower);
  }
  function onDragMoveTower(e) {
    const id = dragTowerRef.current.id;
    if (!id) return;
    const p = boardPosFromEvent(e);
    setTowers((arr) =>
      arr.map((t) =>
        t.id === id ? { ...t, x: +(p.x / boardSize).toFixed(4), y: +(p.y / boardSize).toFixed(4) } : t
      )
    );
  }
  function endDragTower() {
    dragTowerRef.current = { id: null };
    window.removeEventListener("mousemove", onDragMoveTower);
    window.removeEventListener("mouseup", endDragTower);
  }
  function saveTowers() {
    localStorage.setItem(LSK_TOWERS, JSON.stringify(towers));
    alert("Positions des tours enregistrées ✅");
  }
  function resetTowers() {
    localStorage.removeItem(LSK_TOWERS);
    setTowers(defaultTowersNormalized);
  }
  function setAllTowersEnabled(team, value) {
    setTowers((arr) => arr.map((t) => (t.team === team ? { ...t, enabled: value } : t)));
  }

  function resetPositions() { setTokens(defaultTokens(boardSize)); }
  function clearWards() { setWards([]); }
  function exportState() {
    const data = { tokens, wards, visionSide, towers };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Copié dans le presse-papiers ✅");
  }
  function importState() {
    const txt = prompt("Colle ici un JSON d'état :");
    if (!txt) return;
    try {
      const obj = JSON.parse(txt);
      if (obj.tokens) setTokens(obj.tokens);
      if (obj.wards) setWards(obj.wards);
      if (obj.visionSide) setVisionSide(obj.visionSide);
      if (obj.towers) setTowers(obj.towers);
    } catch { alert("JSON invalide"); }
  }

  /* ============ RENDER ============ */
  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-slate-800/70 p-4 shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Contrôles</h2>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setVisionSide("blue")}
                className={`px-3 py-2 rounded-xl shadow ${visionSide === "blue" ? "bg-blue-500 text-white" : "bg-slate-700"}`}>
                Vision Blue
              </button>
              <button onClick={() => setVisionSide("red")}
                className={`px-3 py-2 rounded-xl shadow ${visionSide === "red" ? "bg-rose-500 text-white" : "bg-slate-700"}`}>
                Vision Red
              </button>
              <button onClick={() => setVisionSide("off")}
                className={`px-3 py-2 rounded-xl shadow ${visionSide === "off" ? "bg-emerald-500 text-white" : "bg-slate-700"}`}>
                Vision Off
              </button>
            </div>

            <div className="h-px bg-slate-700 my-3" />

            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wide text-slate-400">Outils</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTool({ type: "select", team: tool.team, ward: tool.ward })}
                  className={`px-3 py-2 rounded-xl shadow ${toolIs("select") ? "bg-slate-600" : "bg-slate-700"}`}>
                  Sélection / Déplacement
                </button>
                <button onClick={() => setTool({ type: "ward", team: "blue", ward: tool.ward })}
                  className={`px-3 py-2 rounded-xl shadow ${toolIs("ward") && tool.team === "blue" ? "bg-blue-600" : "bg-slate-700"}`}>
                  Ward Blue
                </button>
                <button onClick={() => setTool({ type: "ward", team: "red", ward: tool.ward })}
                  className={`px-3 py-2 rounded-xl shadow ${toolIs("ward") && tool.team === "red" ? "bg-rose-600" : "bg-slate-700"}`}>
                  Ward Red
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["stealth", "control", "trap"].map((k) => (
                  <button key={k} onClick={() => setTool((t) => ({ ...t, ward: k }))}
                    className={`px-3 py-1.5 rounded-xl text-sm shadow ${tool.ward === k ? "bg-amber-600" : "bg-slate-700"}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-700 my-3" />

            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wide text-slate-400">Carte</div>
              <input className="w-full px-3 py-2 rounded-xl bg-slate-700 placeholder:text-slate-400"
                     placeholder="URL d'image (optionnel)" value={bgUrl}
                     onChange={(e) => setBgUrl(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                Afficher la grille
              </label>
            </div>

            <div className="h-px bg-slate-700 my-3" />

            {/* Tours */}
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wide text-slate-400">Tours</div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setAllTowersEnabled("blue", true)} className="px-3 py-2 rounded-xl bg-blue-600">Activer Blue</button>
                <button onClick={() => setAllTowersEnabled("blue", false)} className="px-3 py-2 rounded-xl bg-slate-700">Désactiver Blue</button>
                <button onClick={() => setAllTowersEnabled("red", true)} className="px-3 py-2 rounded-xl bg-rose-600">Activer Red</button>
                <button onClick={() => setAllTowersEnabled("red", false)} className="px-3 py-2 rounded-xl bg-slate-700">Désactiver Red</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setEditTowers((v) => !v)}
                        className={`px-3 py-2 rounded-xl ${editTowers ? "bg-amber-600" : "bg-slate-700"}`}>
                  {editTowers ? "Quitter édition" : "Éditer les tours"}
                </button>
                <button onClick={saveTowers} className="px-3 py-2 rounded-xl bg-slate-700">Enregistrer</button>
                <button onClick={resetTowers} className="px-3 py-2 rounded-xl bg-slate-700">Réinitialiser</button>
              </div>
              <p className="text-xs text-slate-400">
                Cliquer une tour: activer/désactiver. En mode édition: glisser pour repositionner (puis “Enregistrer”).
              </p>

              {/* Calibrage rapide */}
              <div className="h-px bg-slate-700 my-3" />
              <div className="space-y-2">
                <div className="text-sm uppercase tracking-wide text-slate-400">Calibrage vision</div>
                <label className="text-xs text-slate-400">Rayon tour: {towerVisionRadius}px</label>
                <input type="range" min="300" max="1200" value={towerVisionRadius} onChange={(e)=>setTowerVisionRadius(+e.target.value)} />
                <label className="text-xs text-slate-400">Rayon champion: {tokenVisionRadius}px</label>
                <input type="range" min="240" max="600" value={tokenVisionRadius} onChange={(e)=>setTokenVisionRadius(+e.target.value)} />
              </div>
            </div>

            <div className="h-px bg-slate-700 my-3" />

            <div className="flex flex-wrap gap-2">
              <button onClick={resetPositions} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Reset positions</button>
              <button onClick={clearWards} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Clear wards</button>
              <button onClick={exportState} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Exporter</button>
              <button onClick={importState} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Importer</button>
            </div>
          </div>
        </aside>

        {/* Board */}
        <main className="col-span-12 lg:col-span-9">
          <div ref={containerRef} className="rounded-2xl overflow-hidden bg-slate-800 shadow-2xl">
            <div className="relative" style={{ width: boardSize, height: boardSize }}>
              <div
                ref={boardRef}
                onClick={onBoardClick}
                onMouseDown={(e) => onBoardAltClick(e)}
                onContextMenu={(e) => e.preventDefault()}
                className="relative select-none"
                style={{ width: boardSize, height: boardSize }}
              >
                {/* Map background */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${bgUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                {/* Optional grid */}
                {showGrid && (
                  <svg className="absolute inset-0" width={boardSize} height={boardSize}>
                    {[...Array(10)].map((_, i) => (
                      <line key={`v${i}`} x1={(i + 1) * (boardSize / 11)} y1="0" x2={(i + 1) * (boardSize / 11)} y2={boardSize} stroke="rgba(255,255,255,.08)" />
                    ))}
                    {[...Array(10)].map((_, i) => (
                      <line key={`h${i}`} y1={(i + 1) * (boardSize / 11)} x1="0" y2={(i + 1) * (boardSize / 11)} x2={boardSize} stroke="rgba(255,255,255,.08)" />
                    ))}
                  </svg>
                )}

                {/* Wards */}
                {wards.map((w) => (
                  <div
                    key={w.id}
                    title={`${w.team} ${w.kind}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-2 ${
                      w.team === "blue" ? "ring-blue-400" : "ring-rose-400"
                    } ${
                      w.kind === "control" ? "bg-amber-400" : w.kind === "stealth" ? "bg-emerald-400" : "bg-violet-400"
                    }`}
                    style={{ left: w.x, top: w.y }}
                  />
                ))}

                {/* Tokens */}
                {tokens.map((t) => {
                  const enemy = t.team !== visionSide;
                  let show = true;
                  if (enemy) {
                    const fogVisible = isVisibleOnCurrentFog(t.x, t.y);
                    if (!fogVisible) show = false;
                    if (show && inBrushArea(t.x, t.y) && !allyRevealsBush(t.x, t.y, visionSide)) show = false;
                  }
                  if (!show) return null;
                  return (
                    <button
                      key={t.id}
                      onMouseDown={(e) => beginDragToken(e, t.id)}
                      onTouchStart={(e) => beginDragToken(e, t.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg px-2 py-1 text-xs font-bold border ${
                        t.team === "blue" ? "bg-blue-500/90 border-blue-300 text-white" : "bg-rose-500/90 border-rose-300 text-white"
                      }`}
                      style={{ left: t.x, top: t.y }}
                    >
                      {t.id}
                    </button>
                  );
                })}

                {/* Towers */}
                {towers.map((tw) => {
                  const px = tw.x * boardSize;
                  const py = tw.y * boardSize;
                  return (
                    <button
                      key={tw.id}
                      title={`${tw.id} (${tw.enabled ? "ON" : "OFF"})`}
                      onClick={(e) => { e.stopPropagation(); toggleTowerEnable(tw.id); }}
                      onMouseDown={(e) => beginDragTower(e, tw.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                        tw.team === "blue"
                          ? (tw.enabled ? "bg-blue-500 text-white border-blue-300" : "bg-blue-900 text-slate-300 border-blue-700")
                          : (tw.enabled ? "bg-rose-500 text-white border-rose-300" : "bg-rose-900 text-slate-300 border-rose-700")
                      } ${editTowers ? "cursor-move" : "cursor-pointer"}`}
                      style={{ left: px, top: py }}
                    >
                      T
                    </button>
                  );
                })}

                {/* Fog of War */}
                <canvas ref={fogCanvasRef} className="absolute inset-0 pointer-events-none" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
