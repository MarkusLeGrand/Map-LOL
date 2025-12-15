import type { Faelight } from '../types';

export const defaultFaelights: Faelight[] = [
    // Banana (Base map)
    {
        id: 'faelight-banana-top',
        x: 0.334,
        y: 0.418,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-top-banana.png',
        name: 'Banana Top',
        category: 'base'
    },
    {
        id: 'faelight-banana-bot',
        x: 0.681,
        y: 0.597,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-bot-banana.png',
        name: 'Banana Bot',
        category: 'base'
    },

    // Pixel (Base map)
    {
        id: 'faelight-pixel-top',
        x: 0.229,
        y: 0.242,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-top-pixel.png',
        name: 'Pixel Top',
        category: 'base'
    },
    {
        id: 'faelight-pixel-bot',
        x: 0.774,
        y: 0.738,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-bot-pixel.png',
        name: 'Pixel Bot',
        category: 'base'
    },

    // Blue Jungle (Evolved - after map changes)
    {
        id: 'faelight-blue-top-jungle',
        x: 0.157,
        y: 0.349,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-blue-top-jungle.png',
        name: 'Blue Top Jungle',
        category: 'evolved'
    },
    {
        id: 'faelight-blue-bot-jungle',
        x: 0.621,
        y: 0.854,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-blue-bot-jungle.png',
        name: 'Blue Bot Jungle',
        category: 'evolved'
    },

    // Red Jungle (Evolved - after map changes)
    {
        id: 'faelight-red-top-jungle',
        x: 0.361,
        y: 0.132,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-red-top-jungle.png',
        name: 'Red Top Jungle',
        category: 'evolved'
    },
    {
        id: 'faelight-red-bot-jungle',
        x: 0.869,
        y: 0.603,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-red-bot-jungle.png',
        name: 'Red Bot Jungle',
        category: 'evolved'
    },

    // Blue Base (Evolved - after map changes)
    {
        id: 'faelight-blue-top',
        x: 0.191,
        y: 0.664,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-blue-top.png',
        name: 'Blue Top Base',
        category: 'base'
    },
    {
        id: 'faelight-blue-bot',
        x: 0.338,
        y: 0.812,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-blue-bot.png',
        name: 'Blue Bot Base',
        category: 'base'
    },

    // Red Base (Evolved - after map changes)
    {
        id: 'faelight-red-top',
        x: 0.662,
        y: 0.192,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-red-top.png',
        name: 'Red Top Base',
        category:  'base'
    },
    {
        id: 'faelight-red-bot',
        x: 0.810,
        y: 0.337,
        detectionRadius: 0.013,
        zoneMaskPath: '/masks/faeligths/fae-red-bot.png',
        name: 'Red Bot Base',
        category:  'base'
    },
];
