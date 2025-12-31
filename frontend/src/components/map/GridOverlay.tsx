interface GridOverlayProps {
    boardSize: number;
    gridSize: number;
    selectedCells: Set<string>;
}

export function GridOverlay({ boardSize, gridSize, selectedCells }: GridOverlayProps) {
    const cellSize = boardSize / gridSize;

    return (
        <div className="absolute top-0 left-0 pointer-events-none" style={{ width: boardSize, height: boardSize }}>
            {Array.from(selectedCells).map(cellKey => {
                const [cellX, cellY] = cellKey.split(',').map(Number);
                const x = cellX * cellSize;
                const y = cellY * cellSize;

                return (
                    <div
                        key={cellKey}
                        className="absolute bg-yellow-500 bg-opacity-20"
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                        }}
                    />
                );
            })}
        </div>
    );
}
