import { useEffect, useRef, useState } from 'react';
import type { Token, Tower, VisionMode, Ward, Faelight, FaelightActivation } from '../types';
import { VISION_RANGES } from '../config/visionRanges';

interface FogOfWarProps {
    boardSize: number;
    tokens: Token[];
    towers: Tower[];
    wards?: Ward[];
    visionMode: VisionMode;
    onVisionUpdate?: (visionData: ImageData, brushData: ImageData) => void;
    faelights?: Faelight[];
    faelightActivations?: FaelightActivation[];
    faelightMasks?: Map<string, HTMLImageElement>;
}

export function FogOfWar({ boardSize, tokens, towers, wards = [], visionMode, onVisionUpdate, faelights, faelightActivations, faelightMasks }: FogOfWarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [wallsImg] = useState(() => {
        const img = new Image();
        img.src = '/masks/walls.png';
        return img;
    });
    const [brushImg] = useState(() => {
        const img = new Image();
        img.src = '/masks/bush.png';
        return img;
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || visionMode === 'off') return;
        if (!wallsImg.complete || !brushImg.complete) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Créer masques séparés walls et brush
        const wallsCanvas = document.createElement('canvas');
        wallsCanvas.width = 512;
        wallsCanvas.height = 512;
        const wallsCtx = wallsCanvas.getContext('2d');
        if (!wallsCtx) return;
        wallsCtx.drawImage(wallsImg, 0, 0, 512, 512);
        const wallsData = wallsCtx.getImageData(0, 0, 512, 512);

        const brushCanvas = document.createElement('canvas');
        brushCanvas.width = 512;
        brushCanvas.height = 512;
        const brushCtx = brushCanvas.getContext('2d');
        if (!brushCtx) return;
        brushCtx.drawImage(brushImg, 0, 0, 512, 512);
        const brushData = brushCtx.getImageData(0, 0, 512, 512);

        // Fonction: pixel est un mur?
        const isWall = (px: number, py: number): boolean => {
            const gx = Math.floor((px / boardSize) * 512);
            const gy = Math.floor((py / boardSize) * 512);
            if (gx < 0 || gy < 0 || gx >= 512 || gy >= 512) return true;

            const idx = (gy * 512 + gx) * 4;
            const brightness = (wallsData.data[idx] + wallsData.data[idx + 1] + wallsData.data[idx + 2]) / 3;
            return brightness > 128; // BLANC = mur
        };

        // Fonction: pixel est un bush?
        const isBrush = (px: number, py: number): boolean => {
            const gx = Math.floor((px / boardSize) * 512);
            const gy = Math.floor((py / boardSize) * 512);
            if (gx < 0 || gy < 0 || gx >= 512 || gy >= 512) return false;

            const idx = (gy * 512 + gx) * 4;
            const brightness = (brushData.data[idx] + brushData.data[idx + 1] + brushData.data[idx + 2]) / 3;
            return brightness > 128; // BLANC = brush
        };

        // Raycast avec option pour ignorer brush
        const raycast = (sx: number, sy: number, angle: number, maxDist: number, ignoreBrush: boolean): number => {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const steps = 150;
            const stepSize = maxDist / steps;

            for (let i = 1; i <= steps; i++) {
                const dist = i * stepSize;
                const px = sx + dx * dist;
                const py = sy + dy * dist;

                // Toujours bloquer sur les murs
                if (isWall(px, py)) return dist;

                // Bloquer sur les brush seulement si ignoreBrush est false
                if (!ignoreBrush && isBrush(px, py)) return dist;
            }
            return maxDist;
        };

        // Clear
        ctx.clearRect(0, 0, boardSize, boardSize);

        // Valeurs
        const championVisionRange = boardSize * VISION_RANGES.CHAMPION;

        const sources: Array<{ x: number; y: number; range: number; inBrush: boolean }> = [];

        // Champions
        tokens.forEach(token => {
            const shouldShow =
                visionMode === 'both' ||
                (visionMode === 'blue' && token.team === 'blue') ||
                (visionMode === 'red' && token.team === 'red');

            if (shouldShow) {
                const x = token.x * boardSize;
                const y = token.y * boardSize;
                sources.push({
                    x,
                    y,
                    range: championVisionRange,
                    inBrush: isBrush(x, y)
                });
            }
        });

        // Tours
        towers.forEach(tower => {
            if (!tower.active) return;
            const shouldShow =
                visionMode === 'both' ||
                (visionMode === 'blue' && tower.team === 'blue') ||
                (visionMode === 'red' && tower.team === 'red');

            if (shouldShow) {
                const x = tower.x * boardSize;
                const y = tower.y * boardSize;
                sources.push({
                    x,
                    y,
                    range: tower.visionRadius * boardSize,
                    inBrush: isBrush(x, y)
                });
            }
        });

        // Wards (seulement les actives et non désactivées)
        wards.forEach(ward => {
            if (!ward.active || ward.disabled) return;
            const shouldShow =
                visionMode === 'both' ||
                (visionMode === 'blue' && ward.team === 'blue') ||
                (visionMode === 'red' && ward.team === 'red');

            if (shouldShow) {
                const x = ward.x * boardSize;
                const y = ward.y * boardSize;
                sources.push({
                    x,
                    y,
                    range: ward.visionRadius * boardSize,
                    inBrush: isBrush(x, y)
                });
            }
        });

        // Dessiner masque de vision sur canvas temporaire
        const visionCanvas = document.createElement('canvas');
        visionCanvas.width = boardSize;
        visionCanvas.height = boardSize;
        const visionCtx = visionCanvas.getContext('2d');
        if (!visionCtx) return;

        visionCtx.fillStyle = 'white';
        const numRays = 180;

        sources.forEach(source => {
            visionCtx.beginPath();
            visionCtx.moveTo(source.x, source.y);

            for (let i = 0; i <= numRays; i++) {
                const angle = (i / numRays) * Math.PI * 2;
                // Si la source est dans un bush, ignorer les brush pour le raycast
                const dist = raycast(source.x, source.y, angle, source.range, source.inBrush);
                const ex = source.x + Math.cos(angle) * dist;
                const ey = source.y + Math.sin(angle) * dist;
                visionCtx.lineTo(ex, ey);
            }

            visionCtx.closePath();
            visionCtx.fill();
        });

        const visionData = visionCtx.getImageData(0, 0, boardSize, boardSize);

        // === FAELIGHT ZONE VISION ===
        // Add zone vision from activated Faelights
        if (faelights && faelightActivations && faelightMasks) {
            // Create canvas for Faelight vision
            const faelightVisionCanvas = document.createElement('canvas');
            faelightVisionCanvas.width = boardSize;
            faelightVisionCanvas.height = boardSize;
            const faelightCtx = faelightVisionCanvas.getContext('2d');
            if (faelightCtx) {
                // Filter activations based on current vision mode
                const activeForCurrentMode = faelightActivations.filter(activation => {
                    if (visionMode === 'both') return true;
                    if (visionMode === 'blue') return activation.team === 'blue';
                    if (visionMode === 'red') return activation.team === 'red';
                    return false;
                });

                // Draw each activated zone
                activeForCurrentMode.forEach(activation => {
                    const faelight = faelights.find(f => f.id === activation.faelightId);
                    const maskImg = faelightMasks.get(activation.faelightId);

                    if (!faelight || !maskImg || !maskImg.complete) {
                        return;
                    }

                    // Load zone mask
                    const zoneCanvas = document.createElement('canvas');
                    zoneCanvas.width = 512;
                    zoneCanvas.height = 512;
                    const zoneCtx = zoneCanvas.getContext('2d');
                    if (!zoneCtx) return;

                    zoneCtx.drawImage(maskImg, 0, 0, 512, 512);
                    const zoneMaskData = zoneCtx.getImageData(0, 0, 512, 512);

                    // Apply wall masking to zone (walls block vision)
                    for (let i = 0; i < zoneMaskData.data.length; i += 4) {
                        const wallPixel = wallsData.data[i];
                        if (wallPixel > 128) { // Wall detected
                            zoneMaskData.data[i] = 0;     // Black
                            zoneMaskData.data[i + 1] = 0;
                            zoneMaskData.data[i + 2] = 0;
                        }
                    }

                    // Scale and draw zone
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 512;
                    tempCanvas.height = 512;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (!tempCtx) return;
                    tempCtx.putImageData(zoneMaskData, 0, 0);

                    const scaledCanvas = document.createElement('canvas');
                    scaledCanvas.width = boardSize;
                    scaledCanvas.height = boardSize;
                    const scaledCtx = scaledCanvas.getContext('2d');
                    if (!scaledCtx) return;
                    scaledCtx.drawImage(tempCanvas, 0, 0, 512, 512, 0, 0, boardSize, boardSize);

                    // Composite with additive blending
                    faelightCtx.globalCompositeOperation = 'lighter';
                    faelightCtx.drawImage(scaledCanvas, 0, 0);
                });

                // Merge Faelight vision with normal vision
                const faelightVisionData = faelightCtx.getImageData(0, 0, boardSize, boardSize);

                for (let i = 0; i < visionData.data.length; i += 4) {
                    // Vision = raycast OR Faelight zone
                    if (visionData.data[i] > 0 || faelightVisionData.data[i] > 0) {
                        visionData.data[i] = 255;
                        visionData.data[i + 1] = 255;
                        visionData.data[i + 2] = 255;
                    }
                }
            }
        }

        // Créer le fog final
        const fogData = ctx.createImageData(boardSize, boardSize);
        for (let i = 0; i < visionData.data.length; i += 4) {
            if (visionData.data[i] > 0) {
                // Vision = transparent
                fogData.data[i + 3] = 0;
            } else {
                // Fog = noir
                fogData.data[i] = 0;
                fogData.data[i + 1] = 0;
                fogData.data[i + 2] = 0;
                fogData.data[i + 3] = 217;
            }
        }

        ctx.putImageData(fogData, 0, 0);

        // Notifier le parent des données de vision et brush
        if (onVisionUpdate) {
            onVisionUpdate(visionData, brushData);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardSize, tokens, towers, wards, visionMode, wallsImg, brushImg, faelights, faelightActivations, faelightMasks]);

    if (visionMode === 'off') return null;

    return (
        <canvas
            ref={canvasRef}
            width={boardSize}
            height={boardSize}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 100 }}
        />
    );
}
