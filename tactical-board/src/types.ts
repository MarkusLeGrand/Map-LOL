export interface Token {
    id: string;
    x: number;  // 0 à 1 (pourcentage de la map)
    y: number;  // 0 à 1 (pourcentage de la map)
    team: 'blue' | 'red' | 'neutral';
    role: string;
    isVisible: boolean;
}

export interface Tower {
    id: string;
    x: number;
    y: number;
    team: 'blue' | 'red';
    type: 'outer' | 'inner' | 'inhibitor' | 'nexus';
    active: boolean;
    visionRadius: number;
}

export type VisionMode = 'off' | 'blue' | 'red' | 'both';

export interface Ward {
    id: string;
    x: number;
    y: number;
    team: 'blue' | 'red';
    type: 'vision' | 'control';
    active: boolean;
    visionRadius: number;
    placedAt?: number;
    duration?: number;
    disabled: boolean;
}

export type WardType = 'vision' | 'control';

export interface DrawingPoint {
    x: number;  // 0-1 (percentage)
    y: number;  // 0-1 (percentage)
}

export interface Drawing {
    id: string;
    points: DrawingPoint[];
    color: string;
    width: number;
}

export type DrawMode = 'pen' | 'eraser' | null;

export interface JungleCamp {
    id: string;
    x: number;
    y: number;
    team: 'blue' | 'red' | 'neutral';
    type: 'baron' | 'dragon' | 'herald' | 'blue-buff' | 'red-buff' | 'gromp' | 'wolves' | 'raptors' | 'krugs' |'carap';
    active: boolean;
    respawnTime?: number;
}

export interface Inhibitor {
    id: string;
    x: number;
    y: number;
    team: 'blue' | 'red';
    lane: 'top' | 'mid' | 'bot';
    active: boolean;
    respawnTime?: number;
}

export interface Faelight {
    id: string;
    x: number;  // 0-1 normalized coordinates
    y: number;  // 0-1 normalized coordinates
    detectionRadius: number;  // Normalized (e.g., 0.025)
    zoneMaskPath: string;  // Path to zone mask image
    name?: string;  // Optional label
}

export interface FaelightActivation {
    faelightId: string;
    team: 'blue' | 'red';
    activatingWardId: string;
}