import type { JungleCamp } from "../types";

export const defaultJungleCamps: JungleCamp[] = [
    // NEUTRAL OBJECTIVES
    { id: 'baron', x: 0.21, y: 0.28, team: 'neutral', type: 'baron', active: true },
    { id: 'dragon', x: 0.79, y: 0.72, team: 'neutral', type: 'dragon', active: true },
    { id: 'herald', x: 0.21, y: 0.28, team: 'neutral', type: 'herald', active: false },

    // BLUE TEAM JUNGLE
    // Blue Buff (Top side)
    { id: 'blue-blue-buff', x: 0.185, y: 0.395, team: 'blue', type: 'blue-buff', active: true },
    // Gromp (Top side)
    { id: 'blue-gromp', x: 0.145, y: 0.45, team: 'blue', type: 'gromp', active: true },
    // Wolves (Mid)
    { id: 'blue-wolves', x: 0.27, y: 0.52, team: 'blue', type: 'wolves', active: true },
    // Red Buff (Bot side)
    { id: 'blue-red-buff', x: 0.375, y: 0.765, team: 'blue', type: 'red-buff', active: true },
    // Raptors (Bot side)
    { id: 'blue-raptors', x: 0.43, y: 0.695, team: 'blue', type: 'raptors', active: true },
    // Krugs (Bot side)
    { id: 'blue-krugs', x: 0.52, y: 0.83, team: 'blue', type: 'krugs', active: true },

    // RED TEAM JUNGLE
    // Blue Buff (Bot side)
    { id: 'red-blue-buff', x: 0.815, y: 0.605, team: 'red', type: 'blue-buff', active: true },
    // Gromp (Bot side)
    { id: 'red-gromp', x: 0.855, y: 0.55, team: 'red', type: 'gromp', active: true },
    // Wolves (Mid)
    { id: 'red-wolves', x: 0.73, y: 0.48, team: 'red', type: 'wolves', active: true },
    // Red Buff (Top side)
    { id: 'red-red-buff', x: 0.625, y: 0.235, team: 'red', type: 'red-buff', active: true },
    // Raptors (Top side)
    { id: 'red-raptors', x: 0.57, y: 0.305, team: 'red', type: 'raptors', active: true },
    // Krugs (Top side)
    { id: 'red-krugs', x: 0.48, y: 0.17, team: 'red', type: 'krugs', active: true },
];
