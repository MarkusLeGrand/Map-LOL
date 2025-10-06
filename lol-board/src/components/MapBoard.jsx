import React from "react";

const MapBoard = ({
  containerRef,
  boardRef,
  fogCanvasRef,
  boardSize,
  bgUrl,
  showGrid,
  showWalls,
  showBrush,
  tokens,
  wards,
  towers,
  visionSide,
  controlTruePx,
  editTowers,
  onBoardClick,
  onBoardAltClick,
  beginDragToken,
  beginDragWard,
  beginDragTower,
  toggleTowerEnable,
  isVisibleOnCurrentFog,
  inBrushArea,
  allyRevealsBush,
}) => (
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
          <img
            src={bgUrl}
            alt="map"
            className="absolute inset-0"
            style={{ width: boardSize, height: boardSize, objectFit: "fill" }}
          />

          {showWalls && (
            <img
              src="/masks/walls.png"
              alt="walls"
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ width: boardSize, height: boardSize, objectFit: "fill" }}
            />
          )}
          {showBrush && (
            <img
              src="/masks/brush.png"
              alt="brush"
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ width: boardSize, height: boardSize, objectFit: "fill" }}
            />
          )}

          {showGrid && (
            <svg className="absolute inset-0" width={boardSize} height={boardSize}>
              {[...Array(10)].map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={(i + 1) * (boardSize / 11)}
                  y1="0"
                  x2={(i + 1) * (boardSize / 11)}
                  y2={boardSize}
                  stroke="rgba(255,255,255,.08)"
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <line
                  key={`h${i}`}
                  y1={(i + 1) * (boardSize / 11)}
                  x1="0"
                  y2={(i + 1) * (boardSize / 11)}
                  x2={boardSize}
                  stroke="rgba(255,255,255,.08)"
                />
              ))}
            </svg>
          )}

          {wards.map((w) => {
            const isControl = w.kind === "control";
            return (
              <React.Fragment key={w.id}>
                <button
                  type="button"
                  onMouseDown={(e) => beginDragWard(e, w.id)}
                  onTouchStart={(e) => beginDragWard(e, w.id)}
                  title={`${w.team} ${w.kind}`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-2 ${
                    w.team === "blue" ? "ring-blue-400" : "ring-rose-400"
                  } ${isControl ? "bg-amber-400" : w.kind === "stealth" ? "bg-emerald-400" : "bg-violet-400"}`}
                  style={{ left: w.x, top: w.y }}
                />
                {isControl && (
                  <svg
                    className="absolute"
                    style={{ left: 0, top: 0, width: boardSize, height: boardSize, pointerEvents: "none" }}
                  >
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r={controlTruePx}
                      fill="none"
                      stroke={w.team === "blue" ? "rgba(59,130,246,0.35)" : "rgba(244,63,94,0.35)"}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                    />
                  </svg>
                )}
              </React.Fragment>
            );
          })}

          {tokens.map((t) => {
            const enemy = visionSide !== "off" && t.team !== visionSide;
            let show = true;
            if (enemy) {
              const fogVisible = isVisibleOnCurrentFog(t.x, t.y, visionSide);
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
                  t.team === "blue"
                    ? "bg-blue-500/90 border-blue-300 text-white"
                    : "bg-rose-500/90 border-rose-300 text-white"
                }`}
                style={{ left: t.x, top: t.y }}
              >
                {t.id}
              </button>
            );
          })}

          {towers.map((tw) => {
            const px = tw.x * boardSize;
            const py = tw.y * boardSize;
            return (
              <button
                key={tw.id}
                title={`${tw.id} (${tw.enabled ? "ON" : "OFF"})`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTowerEnable(tw.id);
                }}
                onMouseDown={(e) => beginDragTower(e, tw.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                  tw.team === "blue"
                    ? tw.enabled
                      ? "bg-blue-500 text-white border-blue-300"
                      : "bg-blue-900 text-slate-300 border-blue-700"
                    : tw.enabled
                    ? "bg-rose-500 text-white border-rose-300"
                    : "bg-rose-900 text-slate-300 border-rose-700"
                } ${editTowers ? "cursor-move" : "cursor-pointer"}`}
                style={{ left: px, top: py }}
              >
                T
              </button>
            );
          })}

          <canvas ref={fogCanvasRef} className="absolute inset-0 pointer-events-none" />
        </div>
      </div>
    </div>
  </main>
);

export default MapBoard;
