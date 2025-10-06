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

    // Vision désactivée
    if (visionSide === "off") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastFogDataRef.current = null;
      return;
    }

    if (visionSide === "global") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastFogDataRef.current = ctx.createImageData(canvas.width, canvas.height);
      return;
    }

    // Sans masque walls: tout sombre (évite la triche)
    if (!wallsGrid) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, boardSize, boardSize);
      lastFogDataRef.current = ctx.getImageData(0, 0, boardSize, boardSize);
      return;
    }

    // Overlay noir
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.64)";
    ctx.fillRect(0, 0, boardSize, boardSize);

    // On va "vider" la fog sur les zones visibles
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";

    const CELL = boardSize / GRID;

    // px -> indices grille (with floor + clamp)
    const toGrid = (px, py) => {
      const ix = clamp(Math.floor((px / boardSize) * GRID), 0, GRID - 1);
      const iy = clamp(Math.floor((py / boardSize) * GRID), 0, GRID - 1);
      return [ix, iy];
    };

    const idxSafe = (ix, iy) => {
      if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) return -1;
      return iy * GRID + ix;
    };

    const isWallCell = (ix, iy) => {
      const idx = idxSafe(ix, iy);
      if (idx < 0 || !wallsGrid) return true; // bord = mur
      const v = wallsGrid[idx]; // 1 = blanc
      return invertWalls ? v === 0 : v === 1;
    };

    const isBrushCell = (ix, iy) => {
      const idx = idxSafe(ix, iy);
      if (idx < 0 || !brushGrid) return false;
      const v = brushGrid[idx];
      return invertBrush ? v === 0 : v === 1;
    };

    // Vision en ligne droite : chaque cellule doit avoir une ligne de vue directe
    const revealFOV = (cx, cy, radiusPx, { sourceTeam, isWard = false }) => {
      const [sx, sy] = toGrid(cx, cy);
      const r = Math.max(1, Math.round((radiusPx / boardSize) * GRID));
      const r2 = r * r;
      const sourceInBush = isBrushCell(sx, sy);

      const visited = new Uint8Array(GRID * GRID);
      const brushVisibilityCache = new Map();

      const canRevealBrushCell = (ix, iy) => {
        if (!isBrushCell(ix, iy)) return true;
        const key = iy * GRID + ix;
        if (brushVisibilityCache.has(key)) return brushVisibilityCache.get(key);

        let bushRevealed = false;
        if (sourceInBush) {
          bushRevealed = true;
        } else {
          const cellCenterX = (ix + 0.5) * CELL;
          const cellCenterY = (iy + 0.5) * CELL;

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

        brushVisibilityCache.set(key, bushRevealed);
        return bushRevealed;
      };

      const hasLineOfSight = (tx, ty) => {
        let x = sx;
        let y = sy;
        const dx = Math.abs(tx - sx);
        const dy = Math.abs(ty - sy);
        const stepX = sx < tx ? 1 : sx > tx ? -1 : 0;
        const stepY = sy < ty ? 1 : sy > ty ? -1 : 0;
        let err = dx - dy;

        while (true) {
          if (!(x === sx && y === sy)) {
            if (isWallCell(x, y)) {
              return x === tx && y === ty;
            }
            if (isBrushCell(x, y) && !canRevealBrushCell(x, y)) {
              return false;
            }
          }

          if (x === tx && y === ty) break;

          const e2 = err * 2;
          if (e2 > -dy) {
            err -= dy;
            x += stepX;
          }
          if (e2 < dx) {
            err += dx;
            y += stepY;
          }
        }

        return true;
      };

      // petit disque au centre pour éviter un trou visuel
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 1.5, 0, Math.PI * 2);
      ctx.fill();

      for (let ix = sx - r; ix <= sx + r; ix += 1) {
        for (let iy = sy - r; iy <= sy + r; iy += 1) {
          if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) continue;
          const dx = ix - sx;
          const dy = iy - sy;
          if (dx * dx + dy * dy > r2) continue;

          const idx = iy * GRID + ix;
          if (visited[idx]) continue;
          if (!hasLineOfSight(ix, iy)) continue;
          if (!canRevealBrushCell(ix, iy)) continue;

          visited[idx] = 1;
          ctx.fillRect(ix * CELL, iy * CELL, CELL + 1, CELL + 1);
        }
      }
    };

    // Tours actives
    towers
      .filter((t) => t.team === visionSide && t.enabled)
      .forEach((t) => {
        revealFOV(t.x * boardSize, t.y * boardSize, towerVisionRadius, {
          sourceTeam: visionSide,
        });
      });

    // Champions
    tokens
      .filter((t) => t.team === visionSide)
      .forEach((t) => {
        revealFOV(t.x, t.y, tokenVisionRadius, { sourceTeam: visionSide });
      });

    // Wards
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
      if (!img) return visionSide === "global";
      const ix = clamp(Math.round(x), 0, boardSize - 1);
      const iy = clamp(Math.round(y), 0, boardSize - 1);
      const offset = (iy * boardSize + ix) * 4;
      // alpha < 10 => la fog a été "percée"
      return img.data[offset + 3] < 10;
    },
    [boardSize, visionSide]
  );

  const inBrushArea = useCallback(
    (x, y) => {
      if (!brushGrid) return false;
      const toGridLocal = (px, py) => {
        const ix = clamp(Math.floor((px / boardSize) * GRID), 0, GRID - 1);
        const iy = clamp(Math.floor((py / boardSize) * GRID), 0, GRID - 1);
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
        const [ix, iy] = toGridLocal(x + ox, y + oy);
        if (brushAt(ix, iy)) return true;
      }
      return false;
    },
    [boardSize, brushGrid, invertBrush]
  );

  const allyRevealsBush = useCallback(
    (x, y, viewerTeam) => {
      const nearWard = wards.some(
        (w) =>
          w.team === viewerTeam &&
          inBrushArea(w.x, w.y) &&
          Math.hypot(w.x - x, w.y - y) < 260
      );
      const nearAlly = tokens.some(
        (a) =>
          a.team === viewerTeam &&
          inBrushArea(a.x, a.y) &&
          Math.hypot(a.x - x, a.y - y) < 220
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
