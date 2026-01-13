import { useState, useEffect } from 'react';

interface MaskImages {
    walls: HTMLImageElement | null;
    brush: HTMLImageElement | null;
    isLoading: boolean;
}

export function useMaskImages(): MaskImages {
    const [walls, setWalls] = useState<HTMLImageElement | null>(null);
    const [brush, setBrush] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const wallsImg = new Image();
        const brushImg = new Image();

        let loadedCount = 0;

        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === 2 && mounted) {
                setIsLoading(false);
            }
        };

        wallsImg.onload = () => {
            if (mounted) {
                setWalls(wallsImg);
                checkComplete();
            }
        };

        wallsImg.onerror = () => {

            checkComplete();
        };

        brushImg.onload = () => {
            if (mounted) {
                setBrush(brushImg);
                checkComplete();
            }
        };

        brushImg.onerror = () => {

            checkComplete();
        };

        wallsImg.src = '/masks/walls.png';
        brushImg.src = '/masks/bush.png';

        return () => {
            mounted = false;
        };
    }, []);

    return { walls, brush, isLoading };
}
