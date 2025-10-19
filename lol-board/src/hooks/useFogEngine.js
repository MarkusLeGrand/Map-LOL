import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [, setFogRevision] = useState(0);

  const brushLabels = useMemo(() => {
    if (!brushGrid) return null;

    const labels = new Int32Array(GRID * GRID).fill(-1);
    const stack = [];
    const offsets = [1, 0, -1, 0, 0, 1, 0, -1];

    const isBrushAt = (ix, iy) => {
      if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) return false;
      const v = brushGrid[iy * GRID + ix];
      return invertBrush ? v === 0 : v === 1;
    };

    let currentLabel = 0;
    for (let iy = 0; iy < GRID; iy += 1) {
      for (let ix = 0; ix < GRID; ix += 1) {
        const idx = iy * GRID + ix;
        if (!isBrushAt(ix, iy) || labels[idx] !== -1) continue;

        labels[idx] = currentLabel;
        stack.push(ix, iy);

        while (stack.length) {
          const cy = stack.pop();
          const cx = stack.pop();

          for (let k = 0; k < offsets.length; k += 2) {
            const nx = cx + offsets[k];
            const ny = cy + offsets[k + 1];
            if (!isBrushAt(nx, ny)) continue;
            const nIdx = ny * GRID + nx;
            if (labels[nIdx] !== -1) continue;
            labels[nIdx] = currentLabel;
            stack.push(nx, ny);
          }
        }

        currentLabel += 1;
      }
    }

    return labels;
  }, [brushGrid, invertBrush]);

  const suppressedWardIds = useMemo(() => {
    if (!Array.isArray(wards) || !wards.length) return new Set();
    const detectionRadius =
      (wardRadius && (wardRadius.pink ?? wardRadius.control ?? wardRadius.stealth)) || 0;
    if (!detectionRadius) return new Set();

    const pinksByTeam = wards.reduce(
      (acc, ward) => {
        if (ward?.kind !== "pink" || !ward.team) return acc;
        acc[ward.team] = acc[ward.team] || [];
        acc[ward.team].push(ward);
        return acc;
      },
      {},
    );

    const result = new Set();
    wards.forEach((ward) => {
      if (!ward || ward.kind === "pink" || !ward.team) return;
      const opponents = ward.team === "blue" ? pinksByTeam.red ?? [] : pinksByTeam.blue ?? [];
      if (!opponents.length) return;
      const suppressed = opponents.some(
        (pink) => Math.hypot((pink?.x ?? 0) - ward.x, (pink?.y ?? 0) - ward.y) <= detectionRadius,
      );
      if (suppressed) {
        result.add(ward.id);
      }
    });

    return result;
  }, [wardRadius, wards]);

  const drawFog = useCallback(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = boardSize;
    canvas.height = boardSize;

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

    const getBrushLabel = (ix, iy) => {
      if (!brushLabels) return -1;
      const idx = idxSafe(ix, iy);
      if (idx < 0) return -1;
      return brushLabels[idx];
    };

    // Vision en ligne droite : chaque cellule doit avoir une ligne de vue directe
    const revealFOV = (cx, cy, radiusPx, { sourceTeam }) => {
      const [sx, sy] = toGrid(cx, cy);
      const r = Math.max(1, Math.round((radiusPx / boardSize) * GRID));
      const r2 = r * r;
      const sourceInBush = isBrushCell(sx, sy);
      const sourceBrushLabel =
        sourceInBush && brushLabels ? getBrushLabel(sx, sy) : -1;

      const visited = new Uint8Array(GRID * GRID);
      const brushVisibilityCache = new Map();

      const canRevealBrushCell = (ix, iy) => {
        if (!isBrushCell(ix, iy)) return true;
        const key = iy * GRID + ix;
        if (brushVisibilityCache.has(key)) return brushVisibilityCache.get(key);

        let bushRevealed = false;
        if (sourceBrushLabel !== -1) {
          bushRevealed = getBrushLabel(ix, iy) === sourceBrushLabel;
        }

        if (!bushRevealed) {
          const targetLabel = getBrushLabel(ix, iy);
          if (targetLabel === -1) {
            bushRevealed = true;
          } else {
            const cellCenterX = (ix + 0.5) * CELL;
            const cellCenterY = (iy + 0.5) * CELL;

            const revealByWard = wards.some((w) => {
              if (w.team !== sourceTeam) return false;
              if (suppressedWardIds.has(w.id)) return false;
              const [wx, wy] = toGrid(w.x, w.y);
              if (getBrushLabel(wx, wy) !== targetLabel) return false;
              return Math.hypot(w.x - cellCenterX, w.y - cellCenterY) < 260;
            });

            if (revealByWard) {
              bushRevealed = true;
            } else {
              const revealByAlly = tokens.some((a) => {
                if (a.team !== sourceTeam) return false;
                const [ax, ay] = toGrid(a.x, a.y);
                if (getBrushLabel(ax, ay) !== targetLabel) return false;
                return (
                  Math.hypot(a.x - cellCenterX, a.y - cellCenterY) < 220
                );
              });

              bushRevealed = revealByAlly;
            }
          }
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
    const towerRadiusFor = (towerId) => {
      if (!towerVisionRadius) return 0;
      if (towerId.includes("_t1_")) return towerVisionRadius.outer;
      if (towerId.includes("_t2_")) return towerVisionRadius.inner;
      if (towerId.includes("_t3_")) return towerVisionRadius.inhibitor;
      if (towerId.includes("nexus")) return towerVisionRadius.nexus;
      return towerVisionRadius.outer;
    };

    const viewerTeams = visionSide === "both" ? ["blue", "red"] : [visionSide];

    viewerTeams.forEach((team) => {
      towers
        .filter((t) => t.team === team && t.enabled)
        .forEach((t) => {
          const radius = towerRadiusFor(t.id);
          if (!radius) return;
          revealFOV(t.x * boardSize, t.y * boardSize, radius, {
            sourceTeam: team,
          });
        });
    });

    // Champions
    viewerTeams.forEach((team) => {
      tokens
        .filter((t) => t.team === team)
        .forEach((t) => {
          revealFOV(t.x, t.y, tokenVisionRadius, { sourceTeam: team });
        });
    });

    // Wards
    viewerTeams.forEach((team) => {
      wards
        .filter((w) => w.team === team && !suppressedWardIds.has(w.id))
        .forEach((w) => {
          revealFOV(w.x, w.y, wardRadius[w.kind] || 250, {
            sourceTeam: team,
          });
        });
    });

    lastFogDataRef.current = ctx.getImageData(0, 0, boardSize, boardSize);
    ctx.globalCompositeOperation = "source-over";
  }, [
    boardSize,
    invertBrush,
    invertWalls,
    brushLabels,
    tokenVisionRadius,
    towerVisionRadius,
    visionSide,
    wardRadius,
    wards,
    tokens,
    towers,
    wallsGrid,
    brushGrid,
    suppressedWardIds,
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
      if (!brushLabels) {
        const nearWard = wards.some(
          (w) =>
            w.team === viewerTeam &&
            !suppressedWardIds.has(w.id) &&
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
      }

      const toGridLocal = (px, py) => {
        const ix = clamp(Math.floor((px / boardSize) * GRID), 0, GRID - 1);
        const iy = clamp(Math.floor((py / boardSize) * GRID), 0, GRID - 1);
        return [ix, iy];
      };

      const [ix, iy] = toGridLocal(x, y);
      const targetIdx = iy * GRID + ix;
      if (brushLabels[targetIdx] === -1) return false;

      const targetLabel = brushLabels[targetIdx];

      const revealByWard = wards.some((w) => {
        if (w.team !== viewerTeam) return false;
        if (suppressedWardIds.has(w.id)) return false;
        const [wx, wy] = toGridLocal(w.x, w.y);
        const wardIdx = wy * GRID + wx;
        if (brushLabels[wardIdx] !== targetLabel) return false;
        return Math.hypot(w.x - x, w.y - y) < 260;
      });

      if (revealByWard) return true;

      return tokens.some((a) => {
        if (a.team !== viewerTeam) return false;
        const [ax, ay] = toGridLocal(a.x, a.y);
        const allyIdx = ay * GRID + ax;
        if (brushLabels[allyIdx] !== targetLabel) return false;
        return Math.hypot(a.x - x, a.y - y) < 220;
      });
    },
    [boardSize, brushLabels, inBrushArea, tokens, wards, suppressedWardIds]
  );

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      drawFog();
      setFogRevision((v) => v + 1);
    });
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
