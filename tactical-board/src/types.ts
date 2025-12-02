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