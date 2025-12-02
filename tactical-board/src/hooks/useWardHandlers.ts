import { useCallback } from 'react';
import type { Ward, WardType } from '../types';
import { VISION_RANGES } from '../config/visionRanges';

interface UseWardHandlersProps {
    setWards: React.Dispatch<React.SetStateAction<Ward[]>>;
    placingWard: WardType | null;
    selectedTeam: 'blue' | 'red';
}

export function useWardHandlers({ setWards, placingWard, selectedTeam }: UseWardHandlersProps) {
    const handleWardPlace = useCallback((x: number, y: number) => {
        if (!placingWard) {
            return;
        }

        let visionRadius: number;
        if (placingWard === 'vision') {
            visionRadius = VISION_RANGES.VISION_WARD;
        } else {
            visionRadius = VISION_RANGES.CONTROL_WARD;
        }

        const newWard: Ward = {
            id: `ward-${Date.now()}-${Math.random()}`,
            x,
            y,
            team: selectedTeam,
            type: placingWard,
            active: true,
            visionRadius: visionRadius,
            disabled: false,
        };

        setWards(prev => [...prev, newWard]);
    }, [placingWard, selectedTeam, setWards]);

    const handleWardRemove = useCallback((id: string) => {
        setWards(prev => {
            return prev.filter(ward => ward.id !== id);
        });
    }, [setWards]);

    const handleWardMove = useCallback((id: string, x: number, y: number) => {
        setWards(prev => {
            return prev.map(ward => {
                if (ward.id === id) {
                    return { ...ward, x, y };
                }
                return ward;
            });
        });
    }, [setWards]);

    const handleClearAllWards = useCallback(() => {
        setWards([]);
    }, [setWards]);

    return {
        handleWardPlace,
        handleWardRemove,
        handleWardMove,
        handleClearAllWards,
    };
}
