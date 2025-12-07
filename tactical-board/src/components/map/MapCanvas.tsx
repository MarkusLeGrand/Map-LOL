import { useRef, useEffect, useState } from 'react';

interface MapCanvasProps {
    boardSize: number;
    showGrid: boolean;
    gridSize: number;
    showWalls: boolean;
    showBrush: boolean;
    mapImage: HTMLImageElement;
    wallsImage: HTMLImageElement;
    brushImage: HTMLImageElement;
}

export function MapCanvas({
    boardSize,
    showGrid,
    gridSize,
    showWalls,
    showBrush,
    mapImage,
    wallsImage,
    brushImage,
}: MapCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const handleLoad = () => forceUpdate({});

        if (!mapImage.complete) {
            mapImage.addEventListener('load', handleLoad);
        }
        if (!wallsImage.complete) {
            wallsImage.addEventListener('load', handleLoad);
        }
        if (!brushImage.complete) {
            brushImage.addEventListener('load', handleLoad);
        }

        return () => {
            mapImage.removeEventListener('load', handleLoad);
            wallsImage.removeEventListener('load', handleLoad);
            brushImage.removeEventListener('load', handleLoad);
        };
    }, [mapImage, wallsImage, brushImage]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, boardSize, boardSize);

        if (mapImage.complete) {
            ctx.drawImage(mapImage, 0, 0, boardSize, boardSize);
        }

        if (showWalls && wallsImage.complete) {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(wallsImage, 0, 0, boardSize, boardSize);
            ctx.globalAlpha = 1.0;
        }

        if (showBrush && brushImage.complete) {
            ctx.globalAlpha = 0.3;
            ctx.drawImage(brushImage, 0, 0, boardSize, boardSize);
            ctx.globalAlpha = 1.0;
        }

        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            const step = boardSize / gridSize;

            for (let i = 0; i <= gridSize; i++) {
                const pos = i * step;

                ctx.beginPath();
                ctx.moveTo(pos, 0);
                ctx.lineTo(pos, boardSize);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, pos);
                ctx.lineTo(boardSize, pos);
                ctx.stroke();
            }
        }
    }, [mapImage, wallsImage, brushImage, boardSize, showGrid, showWalls, showBrush, gridSize]);

    return (
        <canvas
            ref={canvasRef}
            width={boardSize}
            height={boardSize}
            className="absolute top-0 left-0"
        />
    );
}
