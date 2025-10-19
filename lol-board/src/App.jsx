import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_BOARD,
  LSK_TOWERS,
  LSK_TOKENS,
  LSK_SAVED_POSITIONS,
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
import { normalizeTokens } from "./utils/normalizeTokens";

const createTowerRadii = (size, multiplier = 1) =>
  Object.fromEntries(
    Object.entries(OFFICIAL_TOWER_UNITS).map(([type, units]) => [
      type,
      Math.round(unitsToPx(units, size) * multiplier),
    ]),
  );

const safeRandomId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `pos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function TacticalBoard() {
  const containerRef = useRef(null);
  const boardRef = useRef(null);
  const dragRef = useRef({ id: null, dx: 0, dy: 0, isDup: false });
  const dragWardRef = useRef({ id: null, dx: 0, dy: 0 });
  const dragTowerRef = useRef({ id: null });

  const [boardSize, setBoardSize] = useState(900);
  const [visionSide, setVisionSide] = useState("blue");
  const [tool, setTool] = useState({ type: "select", team: "blue", ward: "stealth", mode: "pen" });
  const [bgUrl, setBgUrl] = useState("/sr.jpg");
  const [showGrid, setShowGrid] = useState(false);

  const sanitizeTowers = (arr) =>
    Array.isArray(arr) ? arr.filter((t) => !t.id?.includes("_inhib_")) : [];

  const cloneWards = (items) =>
    Array.isArray(items)
      ? items
          .map((ward) => {
            if (!ward || typeof ward !== "object") return null;
            const { x, y } = ward;
            if (typeof x !== "number" || typeof y !== "number") return null;
            return {
              id: typeof ward.id === "string" ? ward.id : safeRandomId(),
              team: typeof ward.team === "string" ? ward.team : "blue",
              kind: typeof ward.kind === "string" ? ward.kind : "stealth",
              x,
              y,
            };
          })
          .filter(Boolean)
      : [];

  const cloneDrawings = (items) =>
    Array.isArray(items)
      ? items
          .map((path) => {
            if (!path || typeof path !== "object") return null;
            const points = Array.isArray(path.points)
              ? path.points
                  .map((pt) =>
                    pt && typeof pt === "object" && typeof pt.x === "number" && typeof pt.y === "number"
                      ? { x: pt.x, y: pt.y }
                      : null,
                  )
                  .filter(Boolean)
              : [];
            return {
              id: typeof path.id === "string" ? path.id : safeRandomId(),
              points,
            };
          })
          .filter(Boolean)
      : [];

  const hydrateSavedPositions = (entries) =>
    Array.isArray(entries)
      ? entries
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const {
              id,
              name,
              tokens: savedTokens,
              towers: savedTowers,
              wards: savedWards,
              drawings: savedDrawings,
            } = entry;
            if (typeof id !== "string" || !id.trim()) return null;
            if (typeof name !== "string" || !name.trim()) return null;
            return {
              id,
              name: name.trim(),
              tokens: normalizeTokens(savedTokens ?? []),
              towers: sanitizeTowers(savedTowers ?? []),
              wards: cloneWards(savedWards ?? []),
              drawings: cloneDrawings(savedDrawings ?? []),
            };
          })
          .filter(Boolean)
      : [];

  const [tokens, setTokens] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LSK_TOKENS));
      if (Array.isArray(saved) && saved.length) return normalizeTokens(saved);
    } catch {
      // ignore malformed persisted data
    }
    return normalizeTokens(defaultTokens(900));
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
  const towersRef = useRef(towers);

  const [savedPositions, setSavedPositions] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LSK_SAVED_POSITIONS));
      return hydrateSavedPositions(stored);
    } catch {
      return [];
    }
  });
  const [selectedSavedId, setSelectedSavedId] = useState(null);

  const [editTowers, setEditTowers] = useState(false);
  const [towerVisionRadius, setTowerVisionRadius] = useState(() => createTowerRadii(900));
  const [tokenVisionRadius, setTokenVisionRadius] = useState(320);
  const [wardRadius, setWardRadius] = useState(wardRadiusDefault);
  const [controlTruePx, setControlTruePx] = useState(45);
  const [showWalls, setShowWalls] = useState(false);
  const [showBrush, setShowBrush] = useState(false);
  const [drawings, setDrawings] = useState([]);

  const basePositionRef = useRef(null);
  const baseInitializedRef = useRef(false);
  if (!baseInitializedRef.current) {
    basePositionRef.current = {
      id: null,
      name: "Position de base",
      tokens: tokens.map((token) => ({ ...token })),
      towers: towers.map((tower) => ({ ...tower })),
      wards: wards.map((ward) => ({ ...ward })),
      drawings: drawings.map((path) => ({
        ...path,
        points: Array.isArray(path.points)
          ? path.points.map((pt) => ({ ...pt }))
          : [],
      })),
    };
    baseInitializedRef.current = true;
  }

  useEffect(() => {
    towersRef.current = towers;
  }, [towers]);

  const captureBaseSnapshot = useCallback(
    () => ({
      id: null,
      name: "Position de base",
      tokens: tokens.map((token) => ({ ...token })),
      towers: towers.map((tower) => ({ ...tower })),
      wards: wards.map((ward) => ({ ...ward })),
      drawings: drawings.map((path) => ({
        ...path,
        points: Array.isArray(path.points)
          ? path.points.map((pt) => ({ ...pt }))
          : [],
      })),
    }),
    [drawings, tokens, towers, wards],
  );

  useEffect(() => {
    if (selectedSavedId) return;
    basePositionRef.current = captureBaseSnapshot();
  }, [captureBaseSnapshot, selectedSavedId]);

  const persistTowers = (next) => {
    try {
      localStorage.setItem(LSK_TOWERS, JSON.stringify(next));
    } catch {
      // ignore persistence failures (e.g. private mode)
    }
  };

  const lastAppliedPositionRef = useRef(null);
  const invertWalls = false;
  const invertBrush = false;

  const wallsImg = useImage("/masks/walls.png");
  const brushImg = useImage("/masks/brush.png");

  const wallsGrid = useMemo(() => createBinaryGrid(wallsImg, GRID), [wallsImg]);
  const brushGrid = useMemo(() => createBinaryGrid(brushImg, GRID), [brushImg]);
  const drawStateRef = useRef({ active: false, id: null, mode: null });

  useEffect(() => {
    if (lastAppliedPositionRef.current) return;
    lastAppliedPositionRef.current = {
      id: selectedSavedId,
      name: selectedSavedId
        ? savedPositions.find((pos) => pos.id === selectedSavedId)?.name ?? null
        : basePositionRef.current.name,
      tokens: tokens.map((token) => ({ ...token })),
      towers: towers.map((tower) => ({ ...tower })),
      wards: cloneWards(wards),
      drawings: cloneDrawings(drawings),
    };
  }, [selectedSavedId, savedPositions, tokens, towers, wards, drawings]);

  useEffect(() => {
    localStorage.setItem(LSK_SAVED_POSITIONS, JSON.stringify(savedPositions));
  }, [savedPositions]);

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
    setWardRadius((r) => ({ ...r, stealth: wardPx, control: wardPx, pink: wardPx }));
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
        { id: safeRandomId(), team: tool.team, kind: tool.ward, x: p.x, y: p.y },
      ]);
    }
  };

  const erasePathsAtPoint = (paths, point) =>
    paths.filter((path) =>
      path.points.every((pt) => Math.hypot(pt.x - point.x, pt.y - point.y) > 20),
    );

  const handleBoardPointerDown = (e) => {
    if (tool.type !== "draw") return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.cancelable) e.preventDefault();
    const point = boardPosFromEvent(e);

    if (tool.mode === "pen") {
      const id = safeRandomId();
      drawStateRef.current = { active: true, id, mode: "pen" };
      setDrawings((prev) => [...prev, { id, points: [point] }]);
    } else if (tool.mode === "eraser") {
      drawStateRef.current = { active: true, id: null, mode: "eraser" };
      setDrawings((prev) => erasePathsAtPoint(prev, point));
    }
  };

  const handleBoardPointerMove = (e) => {
    if (tool.type !== "draw") return;
    const state = drawStateRef.current;
    if (!state.active) return;
    if (e.cancelable) e.preventDefault();

    if (e.buttons !== undefined && e.buttons === 0) {
      drawStateRef.current = { active: false, id: null, mode: null };
      return;
    }

    const point = boardPosFromEvent(e);
    if (state.mode === "pen" && state.id) {
      setDrawings((prev) =>
        prev.map((path) =>
          path.id === state.id ? { ...path, points: [...path.points, point] } : path,
        ),
      );
    } else if (state.mode === "eraser") {
      setDrawings((prev) => erasePathsAtPoint(prev, point));
    }
  };

  const handleBoardPointerUp = () => {
    if (!drawStateRef.current.active) return;
    drawStateRef.current = { active: false, id: null, mode: null };
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
    setTowers((arr) => {
      const next = arr.map((t) => (t.id === tid ? { ...t, enabled: !t.enabled } : t));
      persistTowers(next);
      return next;
    });
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
    persistTowers(towersRef.current);
  };

  const applyPositionSnapshot = (snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return;
    const nextTokens = normalizeTokens(snapshot.tokens ?? []);
    const nextTowers = sanitizeTowers(snapshot.towers ?? []);
    const nextWards = cloneWards(snapshot.wards ?? []);
    const nextDrawings = cloneDrawings(snapshot.drawings ?? []);

    setTokens(nextTokens);
    setTowers(nextTowers);
    setWards(nextWards);
    setDrawings(nextDrawings);

    localStorage.setItem(LSK_TOWERS, JSON.stringify(nextTowers));
    localStorage.setItem(LSK_TOKENS, JSON.stringify(nextTokens));

    lastAppliedPositionRef.current = {
      id: snapshot.id ?? null,
      name: snapshot.name ?? null,
      tokens: nextTokens.map((token) => ({ ...token })),
      towers: nextTowers.map((tower) => ({ ...tower })),
      wards: nextWards.map((ward) => ({ ...ward })),
      drawings: nextDrawings.map((path) => ({
        ...path,
        points: Array.isArray(path.points)
          ? path.points.map((pt) => ({ ...pt }))
          : [],
      })),
    };
  };

  const saveBoardState = () => {
    const currentName = selectedSavedId
      ? savedPositions.find((pos) => pos.id === selectedSavedId)?.name ?? ""
      : "";
    const nameInput = prompt("Nom pour cette position :", currentName);
    if (nameInput === null) return;
    const name = nameInput.trim();
    if (!name) {
      alert("Nom invalide");
      return;
    }

    const entryBase = {
      name,
      tokens: tokens.map((token) => ({ ...token })),
      towers: towers.map((tower) => ({ ...tower })),
      wards: cloneWards(wards),
      drawings: cloneDrawings(drawings),
    };

    let finalId = selectedSavedId;
    setSavedPositions((prev) => {
      const next = [...prev];
      if (finalId) {
        const idx = next.findIndex((pos) => pos.id === finalId);
        if (idx >= 0) {
          next[idx] = { ...entryBase, id: finalId };
          return next;
        }
      }

      const existingByNameIndex = next.findIndex(
        (pos) => pos.name.toLowerCase() === name.toLowerCase(),
      );
      if (existingByNameIndex >= 0) {
        finalId = next[existingByNameIndex].id;
        next[existingByNameIndex] = { ...entryBase, id: finalId };
        return next;
      }

      finalId = safeRandomId();
      next.push({ ...entryBase, id: finalId });
      return next;
    });

    if (finalId) {
      setSelectedSavedId(finalId);
    }

    localStorage.setItem(LSK_TOWERS, JSON.stringify(entryBase.towers));
    localStorage.setItem(LSK_TOKENS, JSON.stringify(entryBase.tokens));
    lastAppliedPositionRef.current = {
      id: finalId ?? null,
      name,
      tokens: entryBase.tokens.map((token) => ({ ...token })),
      towers: entryBase.towers.map((tower) => ({ ...tower })),
      wards: entryBase.wards.map((ward) => ({ ...ward })),
      drawings: entryBase.drawings.map((path) => ({
        ...path,
        points: path.points.map((pt) => ({ ...pt })),
      })),
    };
    alert(`Positions enregistrées sous "${name}" ✅`);
  };

  const selectSavedPosition = (id) => {
    if (!id) {
      setSelectedSavedId(null);
      applyPositionSnapshot(basePositionRef.current);
      return;
    }
    const entry = savedPositions.find((pos) => pos.id === id);
    if (!entry) return;
    setSelectedSavedId(id);
    applyPositionSnapshot(entry);
  };

  const resetSelectedPosition = () => {
    if (selectedSavedId) {
      const entry = savedPositions.find((pos) => pos.id === selectedSavedId);
      if (entry) {
        applyPositionSnapshot(entry);
        return;
      }
    } else {
      applyPositionSnapshot(basePositionRef.current);
      return;
    }

    if (lastAppliedPositionRef.current) {
      applyPositionSnapshot(lastAppliedPositionRef.current);
    }
  };

  const deleteSavedPosition = (id) => {
    if (!id) return;
    const entry = savedPositions.find((pos) => pos.id === id);
    if (!entry) return;
    if (!window.confirm(`Supprimer la position "${entry.name}" ?`)) return;
    setSavedPositions((prev) => prev.filter((pos) => pos.id !== id));
    if (selectedSavedId === id) {
      setSelectedSavedId(null);
    }
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
      if (obj.tokens) setTokens(normalizeTokens(obj.tokens));
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
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3">
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
            editTowers={editTowers}
            setEditTowers={setEditTowers}
            saveBoardState={saveBoardState}
            resetSelectedPosition={resetSelectedPosition}
            savedPositions={savedPositions}
            selectedSavedId={selectedSavedId}
            selectSavedPosition={selectSavedPosition}
            deleteSavedPosition={deleteSavedPosition}
            clearWards={clearWards}
            exportState={exportState}
            importState={importState}
          />
        </div>
        <section className="col-span-12 flex flex-col gap-4 lg:col-span-9 lg:flex-row">
          <MapBoard
            containerRef={containerRef}
            boardRef={boardRef}
            fogCanvasRef={fogCanvasRef}
            boardSize={boardSize}
            bgUrl={bgUrl}
            showGrid={showGrid}
            showWalls={showWalls}
            showBrush={showBrush}
            drawings={drawings}
            tokens={tokens}
            wards={wards}
            towers={towers}
            visionSide={visionSide}
            wardRadius={wardRadius}
            editTowers={editTowers}
            onBoardClick={onBoardClick}
            onBoardContextMenu={onBoardContextMenu}
            onBoardPointerDown={handleBoardPointerDown}
            onBoardPointerMove={handleBoardPointerMove}
            onBoardPointerUp={handleBoardPointerUp}
            beginDragToken={beginDragToken}
            beginDragWard={beginDragWard}
            removeWard={removeWardById}
            beginDragTower={beginDragTower}
            toggleTowerEnable={toggleTowerEnable}
            isVisibleOnCurrentFog={isVisibleOnCurrentFog}
            inBrushArea={inBrushArea}
            allyRevealsBush={allyRevealsBush}
          />

          <AnnotationPanel
            tool={tool}
            setTool={setTool}
            clearDrawings={clearDrawings}
            hasDrawings={drawings.length > 0}
          />
        </section>
      </div>
    </div>
  );
}
