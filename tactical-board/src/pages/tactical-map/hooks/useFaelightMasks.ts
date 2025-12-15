import { useEffect, useState } from 'react';
import type { Faelight } from '../types';

/**
 * Hook to load Faelight zone mask images.
 * Loads all masks in parallel and caches them in a Map.
 */
export function useFaelightMasks(faelights: Faelight[]) {
    const [masks, setMasks] = useState<Map<string, HTMLImageElement>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMasks = async () => {
            const newMasks = new Map<string, HTMLImageElement>();

            await Promise.all(
                faelights.map(faelight =>
                    new Promise<void>((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            newMasks.set(faelight.id, img);
                            resolve();
                        };
                        img.onerror = () => {
                            console.error(`Failed to load Faelight zone mask: ${faelight.zoneMaskPath}`);
                            resolve(); // Graceful fallback - continue without this mask
                        };
                        img.src = faelight.zoneMaskPath;
                    })
                )
            );

            setMasks(newMasks);
            setLoading(false);
        };

        loadMasks();
    }, [faelights]);

    return { masks, loading };
}
