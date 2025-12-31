import { useCallback } from 'react';
import type { Tower } from '../types';

interface UseTowerHandlersProps {
    towers: Tower[];
    setTowers: React.Dispatch<React.SetStateAction<Tower[]>>;
}

export function useTowerHandlers({ towers, setTowers }: UseTowerHandlersProps) {
    const handleTowerToggle = useCallback((id: string) => {
        setTowers(prev => {
            return prev.map(tower => {
                if (tower.id === id) {
                    return { ...tower, active: !tower.active };
                }
                return tower;
            });
        });
    }, [setTowers]);

    const toggleAllTowers = useCallback(() => {
        const allActive = towers.every(t => t.active);
        const newActiveState = !allActive;

        setTowers(prev => {
            return prev.map(tower => {
                return { ...tower, active: newActiveState };
            });
        });
    }, [towers, setTowers]);

    return {
        handleTowerToggle,
        toggleAllTowers,
    };
}
