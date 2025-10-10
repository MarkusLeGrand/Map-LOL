import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_BOARD,
  LSK_TOWERS,
  LSK_TOKENS,
  GRID,
  OFFICIAL_UNITS,
  OFFICIAL_TOWER_UNITS,
  unitsToPx,
  wardRadiusDefault,
} from "./config/constants";
import { defaultTowersNormalized, defaultTokens } from "./data/defaults";
import useImage from "./hooks/useImage";
import useFogEngine from "./hooks/useFogEngine";
import ControlPanel from "./components/ControlPanel";
import MapBoard from "./components/MapBoard";
import { createBinaryGrid } from "./utils/createBinaryGrid";

const createTowerRadii = (size, multiplier = 1) =>
  Object.fromEntries(
    Object.entries(OFFICIAL_TOWER_UNITS).map(([type, units]) => [
      type,
      Math.round(unitsToPx(units, size) * multiplier),
    ]),
  );

export default function TacticalBoard() {
  const containerRef = useRef(null);
  const boardRef = useRef(null);
  const dragRef = useRef({ id: null, dx: 0, dy: 0, isDup: false });
  const dragWardRef = useRef({ id: null, dx: 0, dy: 0 });
  const dragTowerRef = useRef({ id: null });

  const [boardSize, setBoardSize] = useState(900);
  const [visionSide, setVisionSide] = useState("blue");
  const [tool, setTool] = useState({ type: "select", team: "blue", ward: "stealth" });
  const [bgUrl, setBgUrl] = useState("/sr.jpg");
  const [showGrid, setShowGrid] = useState(false);

  const sanitizeTowers = (arr) =>
    Array.isArray(arr) ? arr.filter((t) => !t.id?.includes("_inhib_")) : [];

  const [tokens, setTokens] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LSK_TOKENS));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {
      // ignore malformed persisted data
    }
    return defaultTokens(900);
  });
  const [wards, setWards] = useState([]);
  const [towers, setTowers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LSK_TOWERS));
      if (Array.isArray(saved) && saved.length) return sanitizeTowers(saved);
    } catch {
      // ignore malformed persisted data
    }
    return sanitizeTowers(defaultTowersNormalized);
  });

  const [editTowers, setEditTowers] = useState(false);
  const [towerVisionRadius, setTowerVisionRadius] = useState(() => createTowerRadii(900));
  const [tokenVisionRadius, setTokenVisionRadius] = useState(320);
  const [wardRadius, setWardRadius] = useState(wardRadiusDefault);
  const [controlTruePx, setControlTruePx] = useState(45);
  const [showWalls, setShowWalls] = useState(false);
  const [showBrush, setShowBrush] = useState(false);
  const [invertWalls, setInvertWalls] = useState(false);
  const [invertBrush, setInvertBrush] = useState(false);

  const wallsImg = useImage("/masks/walls.png");
  const brushImg = useImage("/masks/brush.png");

  const wallsGrid = useMemo(() => createBinaryGrid(wallsImg, GRID), [wallsImg]);
  const brushGrid = useMemo(() => createBinaryGrid(brushImg, GRID), [brushImg]);

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

  useEffect(() => {
    const champPx = Math.round(unitsToPx(OFFICIAL_UNITS.champSight, boardSize));
    const wardPx = Math.round(unitsToPx(OFFICIAL_UNITS.wardSight, boardSize));
    const ctrlPx = Math.round(unitsToPx(OFFICIAL_UNITS.controlTrue, boardSize));

    setTokenVisionRadius(champPx);
    setWardRadius((r) => ({ ...r, stealth: wardPx, control: wardPx }));
    setControlTruePx(ctrlPx);
    setTowerVisionRadius(createTowerRadii(boardSize));
  }, [boardSize]);

  const { fogCanvasRef, isVisibleOnCurrentFog, inBrushArea, allyRevealsBush } = useFogEngine({
    boardSize,
    tokens,
    wards,
    towers,
    visionSide,
    wallsGrid,
    brushGrid,
    towerVisionRadius,
    tokenVisionRadius,
    wardRadius,
    invertWalls,
    invertBrush,
  });

  const boardPosFromEvent = (e) => {
    const rect = boardRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(boardSize, clientX - rect.left)),
      y: Math.max(0, Math.min(boardSize, clientY - rect.top)),
    };
  };

  const removeWardById = (id) => {
    if (tool.type !== "ward") return;
    setWards((ws) => ws.filter((w) => w.id !== id));
  };

  const removeNearestWard = (p) => {
    setWards((ws) => {
      if (!ws.length) return ws;
      let bestIdx = -1;
      let bestD = 1e9;
      ws.forEach((w, i) => {
        const d = Math.hypot(w.x - p.x, w.y - p.y);
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      });
      if (bestD <= 30) {
        const copy = [...ws];
        copy.splice(bestIdx, 1);
        return copy;
      }
      return ws;
    });
  };

  const onBoardClick = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const p = boardPosFromEvent(e);

    if (tool.type === "ward") {
      setWards((ws) => [
        ...ws,
        { id: crypto.randomUUID(), team: tool.team, kind: tool.ward, x: p.x, y: p.y },
      ]);
    }
  };

  const onBoardContextMenu = (e) => {
    e.preventDefault();
    if (tool.type !== "ward") return;
    const p = boardPosFromEvent(e);
    removeNearestWard(p);
  };

  const beginDragToken = (e, id) => {
    const p = boardPosFromEvent(e);
    const t = tokens.find((tk) => tk.id === id);
    dragRef.current = { id, dx: t.x - p.x, dy: t.y - p.y, isDup: e.shiftKey };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("mouseup", endDragToken);
    window.addEventListener("touchend", endDragToken);
  };

  const onDragMove = (e) => {
    if (!dragRef.current.id) return;
    if (e.cancelable) e.preventDefault();
    const p = boardPosFromEvent(e);
    const { dx, dy, id } = dragRef.current;
    setTokens((arr) => arr.map((t) => (t.id === id ? { ...t, x: p.x + dx, y: p.y + dy } : t)));
  };

  const endDragToken = () => {
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
  };

  const beginDragWard = (e, id) => {
    if (tool.type !== "select") return;
    if (e.button !== undefined && e.button !== 0) return;
    const p = boardPosFromEvent(e);
    const w = wards.find((wd) => wd.id === id);
    if (!w) return;
    dragWardRef.current = { id, dx: w.x - p.x, dy: w.y - p.y };
    window.addEventListener("mousemove", onDragMoveWard);
    window.addEventListener("touchmove", onDragMoveWard, { passive: false });
    window.addEventListener("mouseup", endDragWard);
    window.addEventListener("touchend", endDragWard);
  };

  const onDragMoveWard = (e) => {
    if (!dragWardRef.current.id) return;
    if (e.cancelable) e.preventDefault();
    const p = boardPosFromEvent(e);
    const { id, dx, dy } = dragWardRef.current;
    setWards((arr) => arr.map((w) => (w.id === id ? { ...w, x: p.x + dx, y: p.y + dy } : w)));
  };

  const endDragWard = () => {
    if (!dragWardRef.current.id) return;
    dragWardRef.current = { id: null, dx: 0, dy: 0 };
    window.removeEventListener("mousemove", onDragMoveWard);
    window.removeEventListener("touchmove", onDragMoveWard);
    window.removeEventListener("mouseup", endDragWard);
    window.removeEventListener("touchend", endDragWard);
  };

  const toggleTowerEnable = (tid) => {
    setTowers((arr) => arr.map((t) => (t.id === tid ? { ...t, enabled: !t.enabled } : t)));
  };

  const beginDragTower = (e, tid) => {
    if (!editTowers) return;
    e.stopPropagation();
    dragTowerRef.current = { id: tid };
    window.addEventListener("mousemove", onDragMoveTower);
    window.addEventListener("mouseup", endDragTower);
  };

  const onDragMoveTower = (e) => {
    const id = dragTowerRef.current.id;
    if (!id) return;
    const p = boardPosFromEvent(e);
    setTowers((arr) =>
      arr.map((t) =>
        t.id === id
          ? { ...t, x: +(p.x / boardSize).toFixed(4), y: +(p.y / boardSize).toFixed(4) }
          : t,
      ),
    );
  };

  const endDragTower = () => {
    dragTowerRef.current = { id: null };
    window.removeEventListener("mousemove", onDragMoveTower);
    window.removeEventListener("mouseup", endDragTower);
  };

  const saveBoardState = () => {
    localStorage.setItem(LSK_TOWERS, JSON.stringify(towers));
    localStorage.setItem(LSK_TOKENS, JSON.stringify(tokens));
    alert("Positions des tours et joueurs enregistrées ✅");
  };

  const resetTowers = () => {
    localStorage.removeItem(LSK_TOWERS);
    setTowers(sanitizeTowers(defaultTowersNormalized));
  };

  const setAllTowersEnabled = (team, value) => {
    setTowers((arr) => arr.map((t) => (t.team === team ? { ...t, enabled: value } : t)));
  };

  const resetPositions = () => {
    localStorage.removeItem(LSK_TOKENS);
    setTokens(defaultTokens(boardSize));
  };
  const clearWards = () => setWards([]);

  const exportState = () => {
    const data = {
      tokens,
      wards,
      visionSide,
      towers,
      towerVisionRadius,
      tokenVisionRadius,
      wardRadius,
      controlTruePx,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Copié dans le presse-papiers ✅");
  };

  const importState = () => {
    const txt = prompt("Colle ici un JSON d'état :");
    if (!txt) return;
    try {
      const obj = JSON.parse(txt);
      if (obj.tokens) setTokens(obj.tokens);
      if (obj.wards) setWards(obj.wards);
      if (obj.visionSide) setVisionSide(obj.visionSide === "off" ? "blue" : obj.visionSide);
      if (obj.towers) setTowers(sanitizeTowers(obj.towers));
      if (obj.towerVisionRadius)
        setTowerVisionRadius((prev) => ({ ...prev, ...obj.towerVisionRadius }));
      if (obj.tokenVisionRadius) setTokenVisionRadius(obj.tokenVisionRadius);
      if (obj.wardRadius) setWardRadius(obj.wardRadius);
      if (obj.controlTruePx) setControlTruePx(obj.controlTruePx);
    } catch {
      alert("JSON invalide");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
        <ControlPanel
          visionSide={visionSide}
          setVisionSide={setVisionSide}
          tool={tool}
          setTool={setTool}
          bgUrl={bgUrl}
          setBgUrl={setBgUrl}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showWalls={showWalls}
          setShowWalls={setShowWalls}
          showBrush={showBrush}
          setShowBrush={setShowBrush}
          invertWalls={invertWalls}
          setInvertWalls={setInvertWalls}
          invertBrush={invertBrush}
          setInvertBrush={setInvertBrush}
          editTowers={editTowers}
          setEditTowers={setEditTowers}
          saveBoardState={saveBoardState}
          resetTowers={resetTowers}
          setAllTowersEnabled={setAllTowersEnabled}
          resetPositions={resetPositions}
          clearWards={clearWards}
          exportState={exportState}
          importState={importState}
        />

        <MapBoard
          containerRef={containerRef}
          boardRef={boardRef}
          fogCanvasRef={fogCanvasRef}
          boardSize={boardSize}
          bgUrl={bgUrl}
          showGrid={showGrid}
          showWalls={showWalls}
          showBrush={showBrush}
          tokens={tokens}
          wards={wards}
          towers={towers}
          visionSide={visionSide}
          controlTruePx={controlTruePx}
          wardRadius={wardRadius}
          editTowers={editTowers}
          onBoardClick={onBoardClick}
          onBoardContextMenu={onBoardContextMenu}
          beginDragToken={beginDragToken}
          beginDragWard={beginDragWard}
          removeWard={removeWardById}
          beginDragTower={beginDragTower}
          toggleTowerEnable={toggleTowerEnable}
          isVisibleOnCurrentFog={isVisibleOnCurrentFog}
          inBrushArea={inBrushArea}
          allyRevealsBush={allyRevealsBush}
        />
      </div>
    </div>
  );
}
