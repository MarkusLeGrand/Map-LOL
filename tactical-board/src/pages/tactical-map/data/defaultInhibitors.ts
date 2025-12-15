import type { Inhibitor } from "../types";

export const defaultInhibitors: Inhibitor[] = [
    // BLUE TEAM INHIBITORS
    { id: 'blue-top-inhibitor', x: 0.085, y: 0.757, team: 'blue', lane: 'top', active: true },
    { id: 'blue-mid-inhibitor', x: 0.221, y: 0.781, team: 'blue', lane: 'mid', active: true },
    { id: 'blue-bot-inhibitor', x: 0.238, y: 0.913, team: 'blue', lane: 'bot', active: true },

    // RED TEAM INHIBITORS
    { id: 'red-top-inhibitor', x: 0.757, y: 0.089, team: 'red', lane: 'top', active: true },
    { id: 'red-mid-inhibitor', x: 0.779, y: 0.221, team: 'red', lane: 'mid', active: true },
    { id: 'red-bot-inhibitor', x: 0.912, y: 0.245, team: 'red', lane: 'bot', active: true },
];
