import type { Tower } from "../types";
import { VISION_RANGES } from "../config/visionRanges";

export const defaultTowers: Tower[] = [
    // BLUE TEAM - Top Lane
    { id: 'blue-top-outer', x: 0.07, y: 0.3, team: 'blue', type: 'outer', active: true, visionRadius: VISION_RANGES.TOWERS.outer },
    { id: 'blue-top-inner', x: 0.11, y: 0.55, team: 'blue', type: 'inner', active: true, visionRadius: VISION_RANGES.TOWERS.inner },
    { id: 'blue-top-inhibitor', x: 0.08, y: 0.72, team: 'blue', type: 'inhibitor', active: true, visionRadius: VISION_RANGES.TOWERS.inhibitor },

    // BLUE TEAM - Mid Lane
    { id: 'blue-mid-outer', x: 0.4, y: 0.57, team: 'blue', type: 'outer', active: true, visionRadius: VISION_RANGES.TOWERS.outer },
    { id: 'blue-mid-inner', x: 0.34, y: 0.67, team: 'blue', type: 'inner', active: true, visionRadius: VISION_RANGES.TOWERS.inner },
    { id: 'blue-mid-inhibitor', x: 0.25, y: 0.75, team: 'blue', type: 'inhibitor', active: true, visionRadius: VISION_RANGES.TOWERS.inhibitor },

    // BLUE TEAM - Bot Lane
    { id: 'blue-bot-outer', x: 0.71, y: 0.93, team: 'blue', type: 'outer', active: true, visionRadius: VISION_RANGES.TOWERS.outer },
    { id: 'blue-bot-inner', x: 0.47, y: 0.9, team: 'blue', type: 'inner', active: true, visionRadius: VISION_RANGES.TOWERS.inner },
    { id: 'blue-bot-inhibitor', x: 0.29, y: 0.91, team: 'blue', type: 'inhibitor', active: true, visionRadius: VISION_RANGES.TOWERS.inhibitor },

    // BLUE NEXUS
    { id: 'blue-nexus-1', x: 0.12, y: 0.84, team: 'blue', type: 'nexus', active: true, visionRadius: VISION_RANGES.TOWERS.nexus },
    { id: 'blue-nexus-2', x: 0.15, y: 0.88, team: 'blue', type: 'nexus', active: true, visionRadius: VISION_RANGES.TOWERS.nexus },

    // RED TEAM - Top Lane
    { id: 'red-top-outer', x: 0.3, y: 0.07, team: 'red', type: 'outer', active: true, visionRadius: VISION_RANGES.TOWERS.outer },
    { id: 'red-top-inner', x: 0.54, y: 0.1, team: 'red', type: 'inner', active: true, visionRadius: VISION_RANGES.TOWERS.inner },
    { id: 'red-top-inhibitor', x: 0.7, y: 0.09, team: 'red', type: 'inhibitor', active: true, visionRadius: VISION_RANGES.TOWERS.inhibitor },

    // RED TEAM - Mid Lane
    { id: 'red-mid-outer', x: 0.6, y: 0.43, team: 'red', type: 'outer', active: true, visionRadius: VISION_RANGES.TOWERS.outer },
    { id: 'red-mid-inner', x: 0.66, y: 0.32, team: 'red', type: 'inner', active: true, visionRadius: VISION_RANGES.TOWERS.inner },
    { id: 'red-mid-inhibitor', x: 0.75, y: 0.25, team: 'red', type: 'inhibitor', active: true, visionRadius: VISION_RANGES.TOWERS.inhibitor },

    // RED TEAM - Bot Lane
    { id: 'red-bot-outer', x: 0.93, y: 0.7, team: 'red', type: 'outer', active: true, visionRadius: VISION_RANGES.TOWERS.outer },
    { id: 'red-bot-inner', x: 0.89, y: 0.45, team: 'red', type: 'inner', active: true, visionRadius: VISION_RANGES.TOWERS.inner },
    { id: 'red-bot-inhibitor', x: 0.91, y: 0.29, team: 'red', type: 'inhibitor', active: true, visionRadius: VISION_RANGES.TOWERS.inhibitor },

    // RED NEXUS
    { id: 'red-nexus-1', x: 0.85, y: 0.13, team: 'red', type: 'nexus', active: true, visionRadius: VISION_RANGES.TOWERS.nexus },
    { id: 'red-nexus-2', x: 0.87, y: 0.16, team: 'red', type: 'nexus', active: true, visionRadius: VISION_RANGES.TOWERS.nexus },
];