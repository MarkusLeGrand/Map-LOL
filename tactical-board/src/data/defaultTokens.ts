import type { Token } from "../types";

export const defaultTokens: Token[] = [
    { id: 'blue-top', x: 0.045, y: 0.940, team: 'blue', role: 'TOP', isVisible: true },
    { id: 'blue-jungle', x: 0.060, y: 0.952, team: 'blue', role: 'JUNGLE', isVisible: true },
    { id: 'blue-mid', x: 0.034, y: 0.970, team: 'blue', role: 'MID', isVisible: true },
    { id: 'blue-adc', x: 0.025, y: 0.951, team: 'blue', role: 'ADC', isVisible: true },
    { id: 'blue-support', x: 0.054, y: 0.969, team: 'blue', role: 'SUPPORT', isVisible: true },

    { id: 'red-top', x: 0.955, y: 0.062, team: 'red', role: 'TOP', isVisible: true },
    { id: 'red-jungle', x: 0.939, y: 0.047, team: 'red', role: 'JUNGLE', isVisible: true },
    { id: 'red-mid', x: 0.972, y: 0.052, team: 'red', role: 'MID', isVisible: true },
    { id: 'red-adc', x: 0.973, y: 0.031, team: 'red', role: 'ADC', isVisible: true },
    { id: 'red-support', x: 0.950, y: 0.027, team: 'red', role: 'SUPPORT', isVisible: true },
];
