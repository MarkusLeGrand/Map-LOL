import type { Token } from "../types";

export const defaultTokens: Token[] = [
    // Blue Team
    { id: 'blue-top', x: 0.05, y: 0.94, team: 'blue', role: 'TOP', isVisible: true },
    { id: 'blue-jungle', x: 0.06, y: 0.95, team: 'blue', role: 'JUNGLE', isVisible: true },
    { id: 'blue-mid', x: 0.03, y: 0.97, team: 'blue', role: 'MID', isVisible: true },
    { id: 'blue-adc', x: 0.03, y: 0.95, team: 'blue', role: 'ADC', isVisible: true },
    { id: 'blue-support', x: 0.05, y: 0.97, team: 'blue', role: 'SUPPORT', isVisible: true },

    // Red Team
    { id: 'red-top', x: 0.95, y: 0.06, team: 'red', role: 'TOP', isVisible: true },
    { id: 'red-jungle', x: 0.94, y: 0.05, team: 'red', role: 'JUNGLE', isVisible: true },
    { id: 'red-mid', x: 0.97, y: 0.05, team: 'red', role: 'MID', isVisible: true },
    { id: 'red-adc', x: 0.97, y: 0.03, team: 'red', role: 'ADC', isVisible: true },
    { id: 'red-support', x: 0.95, y: 0.03, team: 'red', role: 'SUPPORT', isVisible: true },
];
