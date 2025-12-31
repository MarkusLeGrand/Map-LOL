import type { JungleCamp } from "../types";

export const defaultJungleCamps: JungleCamp[] = [
    // NEUTRAL OBJECTIVES
    { id: 'baron', x: 0.338, y: 0.305, team: 'neutral', type: 'baron', active: true },
    { id: 'dragon', x: 0.664, y: 0.707, team: 'neutral', type: 'dragon', active: true },

    // BLUE TEAM JUNGLE
    // Blue Buff (Top side)
    { id: 'blue-blue-buff', x: 0.262, y: 0.471, team: 'blue', type: 'blue-buff', active: true },
    // Gromp (Top side)
    { id: 'blue-gromp', x: 0.147, y: 0.443, team: 'blue', type: 'gromp', active: true },
    // Wolves (Mid)
    { id: 'blue-wolves', x: 0.258, y: 0.567, team: 'blue', type: 'wolves', active: true },
    // Red Buff (Bot side)
    { id: 'blue-red-buff', x: 0.525, y: 0.732, team: 'blue', type: 'red-buff', active: true },
    // Raptors (Bot side)
    { id: 'blue-raptors', x: 0.471, y: 0.638, team: 'blue', type: 'raptors', active: true },
    // Krugs (Bot side)
    { id: 'blue-krugs', x: 0.566, y: 0.821, team: 'blue', type: 'krugs', active: true },

    // RED TEAM JUNGLE
    // Blue Buff (Bot side)
    { id: 'red-blue-buff', x: 0.742, y: 0.532, team: 'red', type: 'blue-buff', active: true },
    // Gromp (Bot side)
    { id: 'red-gromp', x: 0.849, y: 0.574, team: 'red', type: 'gromp', active: true },
    // Wolves (Mid)
    { id: 'red-wolves', x: 0.737, y: 0.447, team: 'red', type: 'wolves', active: true },
    // Red Buff (Top side)
    { id: 'red-red-buff', x: 0.482, y: 0.271, team: 'red', type: 'red-buff', active: true },
    // Raptors (Top side)
    { id: 'red-raptors', x: 0.529, y: 0.361, team: 'red', type: 'raptors', active: true },
    // Krugs (Top side)
    { id: 'red-krugs', x: 0.437, y: 0.190, team: 'red', type: 'krugs', active: true },

    // VANILLA
    { id: 'top-carap', x: 0.3, y: 0.36, team: 'neutral', type: 'carap', active: true },
    { id: 'bot -carap', x: 0.7, y: 0.652, team: 'neutral', type: 'carap', active: true },
];
