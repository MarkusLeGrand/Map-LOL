import { useState } from 'react';
import type { Token, Tower, Ward, VisionMode, Drawing, DrawMode, WardType, JungleCamp, Inhibitor, Faelight } from '../types';
import { defaultTokens } from '../data/defaultTokens';
import { defaultTowers } from '../data/defaultTowers';
import { defaultJungleCamps } from '../data/defaultJungleCamps';
import { defaultInhibitors } from '../data/defaultInhibitors';
import { defaultFaelights } from '../data/defaultFaelights';

export function useGameState() {
    const [boardSize, setBoardSize] = useState(800);
    const [showGrid, setShowGrid] = useState(false);
    const [showWalls, setShowWalls] = useState(false);
    const [showBrush, setShowBrush] = useState(false);
    const [visionMode, setVisionMode] = useState<VisionMode>('off');
    const [visionData, setVisionData] = useState<ImageData | null>(null);
    const [brushData, setBrushData] = useState<ImageData | null>(null);

    const [tokens, setTokens] = useState<Token[]>(defaultTokens);
    const [towers, setTowers] = useState<Tower[]>(defaultTowers);
    const [wards, setWards] = useState<Ward[]>([]);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [jungleCamps, setJungleCamps] = useState<JungleCamp[]>(defaultJungleCamps);
    const [inhibitors, setInhibitors] = useState<Inhibitor[]>(defaultInhibitors);
    const [faelights, setFaelights] = useState<Faelight[]>(defaultFaelights);

    const [placingWard, setPlacingWard] = useState<WardType | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<'blue' | 'red'>('blue');
    const [drawMode, setDrawMode] = useState<DrawMode>(null);
    const [showJungleCamps, setShowJungleCamps] = useState(true);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [showTowers, setShowTowers] = useState(true);
    const [showInhibitors, setShowInhibitors] = useState(true);
    const [showFaelights, setShowFaelights] = useState(true);
    const [showEvolvedFaelights, setShowEvolvedFaelights] = useState(false);
    const [selectedGridCells, setSelectedGridCells] = useState<Set<string>>(new Set());
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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
        jungleCamps,
        setJungleCamps,
        inhibitors,
        setInhibitors,
        faelights,
        setFaelights,
        placingWard,
        setPlacingWard,
        selectedTeam,
        setSelectedTeam,
        drawMode,
        setDrawMode,
        showJungleCamps,
        setShowJungleCamps,
        showCoordinates,
        setShowCoordinates,
        showTowers,
        setShowTowers,
        showInhibitors,
        setShowInhibitors,
        showFaelights,
        setShowFaelights,
        showEvolvedFaelights,
        setShowEvolvedFaelights,
        selectedGridCells,
        setSelectedGridCells,
        zoomLevel,
        setZoomLevel,
        panOffset,
        setPanOffset,
    };
}
