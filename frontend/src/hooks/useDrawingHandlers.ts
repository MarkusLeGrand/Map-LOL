import { useCallback } from 'react';
import type { Drawing } from '../types';

interface UseDrawingHandlersProps {
    setDrawings: React.Dispatch<React.SetStateAction<Drawing[]>>;
}

export function useDrawingHandlers({ setDrawings }: UseDrawingHandlersProps) {
    const handleDrawingAdd = useCallback((drawing: Drawing) => {
        setDrawings(prev => [...prev, drawing]);
    }, [setDrawings]);

    const handleDrawingRemove = useCallback((id: string) => {
        setDrawings(prev => {
            return prev.filter(drawing => drawing.id !== id);
        });
    }, [setDrawings]);

    const handleClearAllDrawings = useCallback(() => {
        setDrawings([]);
    }, [setDrawings]);

    return {
        handleDrawingAdd,
        handleDrawingRemove,
        handleClearAllDrawings,
    };
}
