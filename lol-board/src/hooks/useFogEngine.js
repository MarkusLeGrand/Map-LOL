import { useCallback, useEffect, useRef } from "react";
import { GRID } from "../config/constants";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const useFogEngine = ({
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
}) => {
  const fogCanvasRef = useRef(null);
  const lastFogDataRef = useRef(null);
  const rafRef = useRef(0);

  const drawFog = useCallback(() => {
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

    if (!wallsGrid) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, boardSize, boardSize);
      lastFogDataRef.current = ctx.getImageData(0, 0, boardSize, boardSize);
      return;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.64)";
    ctx.fillRect(0, 0, boardSize, boardSize);

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";

    const CELL = boardSize / GRID;

    const toGrid = (px, py) => {
      const ix = Math.round((px / boardSize) * GRID);
      const iy = Math.round((py / boardSize) * GRID);
      return [ix, iy];
    };

    const idxSafe = (ix, iy) => {
      if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) return -1;
      return iy * GRID + ix;
    };

    const isWallCell = (ix, iy) => {
      const idx = idxSafe(ix, iy);
      if (idx < 0 || !wallsGrid) return true;
      const v = wallsGrid[idx];
      return invertWalls ? v === 0 : v === 1;
    };

    const isBrushCell = (ix, iy) => {
      const idx = idxSafe(ix, iy);
      if (idx < 0 || !brushGrid) return false;
      const v = brushGrid[idx];
      return invertBrush ? v === 0 : v === 1;
    };

    const revealFOV = (cx, cy, radiusPx, { sourceTeam, isWard = false }) => {
      const [sx, sy] = toGrid(cx, cy);
      const r = Math.max(1, Math.round((radiusPx / boardSize) * GRID));
      const r2 = r * r;
      const sourceInBush = isBrushCell(sx, sy);

      const vis = new Uint8Array(GRID * GRID);
      const qx = new Int32Array(GRID * GRID);
      const qy = new Int32Array(GRID * GRID);
      let head = 0;
      let tail = 0;

      qx[tail] = sx;
      qy[tail] = sy;
      tail += 1;
      vis[sy * GRID + sx] = 1;

      const nb = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];

      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 1.5, 0, Math.PI * 2);
      ctx.fill();

      while (head < tail) {
        const x = qx[head];
        const y = qy[head];
        head += 1;
        const dx = x - sx;
        const dy = y - sy;
        if (dx * dx + dy * dy > r2) continue;

        ctx.fillRect(x * CELL, y * CELL, CELL + 1, CELL + 1);

        for (let k = 0; k < nb.length; k += 1) {
          const nx = x + nb[k][0];
          const ny = y + nb[k][1];
          if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
          const idx = ny * GRID + nx;
          if (vis[idx]) continue;
          if (isWallCell(nx, ny)) continue;

          if (isBrushCell(nx, ny)) {
            let bushRevealed = false;
            if (sourceInBush) {
              bushRevealed = true;
            } else {
              const cellCenterX = (nx + 0.5) * CELL;
              const cellCenterY = (ny + 0.5) * CELL;

              const revealByWard = wards.some((w) => {
                const [wx, wy] = toGrid(w.x, w.y);
                return (
                  w.team === sourceTeam &&
                  isBrushCell(wx, wy) &&
                  Math.hypot(w.x - cellCenterX, w.y - cellCenterY) < 260
                );
              });

              const revealByAlly = tokens.some((a) => {
                const [ax, ay] = toGrid(a.x, a.y);
                return (
                  a.team === sourceTeam &&
                  isBrushCell(ax, ay) &&
                  Math.hypot(a.x - cellCenterX, a.y - cellCenterY) < 220
                );
              });

              bushRevealed = isWard || revealByWard || revealByAlly;
            }
            if (!bushRevealed) continue;
          }

          vis[idx] = 1;
          qx[tail] = nx;
          qy[tail] = ny;
          tail += 1;
        }
      }
    };

    towers
      .filter((t) => t.team === visionSide && t.enabled)
      .forEach((t) => {
        revealFOV(t.x * boardSize, t.y * boardSize, towerVisionRadius, { sourceTeam: visionSide });
      });

    tokens
      .filter((t) => t.team === visionSide)
      .forEach((t) => {
        revealFOV(t.x, t.y, tokenVisionRadius, { sourceTeam: visionSide });
      });

    wards
      .filter((w) => w.team === visionSide)
      .forEach((w) => {
        revealFOV(w.x, w.y, wardRadius[w.kind] || 250, {
          sourceTeam: visionSide,
          isWard: true,
        });
      });

    lastFogDataRef.current = ctx.getImageData(0, 0, boardSize, boardSize);
    ctx.globalCompositeOperation = "source-over";
  }, [
    boardSize,
    invertBrush,
    invertWalls,
    tokenVisionRadius,
    towerVisionRadius,
    visionSide,
    wardRadius,
    wards,
    tokens,
    towers,
    wallsGrid,
    brushGrid,
  ]);

  const isVisibleOnCurrentFog = useCallback(
    (x, y) => {
      const img = lastFogDataRef.current;
      if (!img) return false;
      const ix = clamp(Math.round(x), 0, boardSize - 1);
      const iy = clamp(Math.round(y), 0, boardSize - 1);
      const offset = (iy * boardSize + ix) * 4;
      return img.data[offset + 3] < 10;
    },
    [boardSize]
  );

  const inBrushArea = useCallback(
    (x, y) => {
      if (!brushGrid) return false;
      const CELL = boardSize / GRID;
      const toGrid = (px, py) => {
        const ix = Math.round((px / boardSize) * GRID);
        const iy = Math.round((py / boardSize) * GRID);
        return [ix, iy];
      };
      const brushAt = (ix, iy) => {
        if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) return false;
        const v = brushGrid[iy * GRID + ix];
        return invertBrush ? v === 0 : v === 1;
      };
      const offs = [
        [0, 0],
        [8, 0],
        [-8, 0],
        [0, 8],
        [0, -8],
      ];
      for (const [ox, oy] of offs) {
        const [ix, iy] = toGrid(x + ox, y + oy);
        if (brushAt(ix, iy)) return true;
      }
      return false;
    },
    [boardSize, brushGrid, invertBrush]
  );

  const allyRevealsBush = useCallback(
    (x, y, viewerTeam) => {
      const nearWard = wards.some(
        (w) => w.team === viewerTeam && inBrushArea(w.x, w.y) && Math.hypot(w.x - x, w.y - y) < 260
      );
      const nearAlly = tokens.some(
        (a) => a.team === viewerTeam && inBrushArea(a.x, a.y) && Math.hypot(a.x - x, a.y - y) < 220
      );
      return nearWard || nearAlly;
    },
    [inBrushArea, tokens, wards]
  );

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawFog);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFog]);

  return {
    fogCanvasRef,
    lastFogDataRef,
    drawFog,
    isVisibleOnCurrentFog,
    inBrushArea,
    allyRevealsBush,
  };
};

export default useFogEngine;
