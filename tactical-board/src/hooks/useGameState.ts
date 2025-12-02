import { useState } from 'react';
import type { Token, Tower, Ward, VisionMode, Drawing, DrawMode, WardType } from '../types';
import { defaultTokens } from '../data/defaultTokens';
import { defaultTowers } from '../data/defaultTowers';

export function useGameState() {
    const [boardSize, setBoardSize] = useState(800);
    const [showGrid, setShowGrid] = useState(true);
    const [showWalls, setShowWalls] = useState(false);
    const [showBrush, setShowBrush] = useState(false);
    const [visionMode, setVisionMode] = useState<VisionMode>('off');
    const [visionData, setVisionData] = useState<ImageData | null>(null);
    const [brushData, setBrushData] = useState<ImageData | null>(null);

    const [tokens, setTokens] = useState<Token[]>(defaultTokens);
    const [towers, setTowers] = useState<Tower[]>(defaultTowers);
    const [wards, setWards] = useState<Ward[]>([]);
    const [drawings, setDrawings] = useState<Drawing[]>([]);

    const [placingWard, setPlacingWard] = useState<WardType | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<'blue' | 'red'>('blue');
    const [drawMode, setDrawMode] = useState<DrawMode>(null);

    return {
        boardSize,
        setBoardSize,
        showGrid,
        setShowGrid,
        showWalls,
        setShowWalls,
        showBrush,
        setShowBrush,
        visionMode,
        setVisionMode,
        visionData,
        setVisionData,
        brushData,
        setBrushData,
        tokens,
        setTokens,
        towers,
        setTowers,
        wards,
        setWards,
        drawings,
        setDrawings,
        placingWard,
        setPlacingWard,
        selectedTeam,
        setSelectedTeam,
        drawMode,
        setDrawMode,
    };
}
