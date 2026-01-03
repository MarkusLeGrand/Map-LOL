export const DISPLAY_CONFIG = {
    SIZES: {
        CHAMPION_TOKEN: 22.5,
        TOWER: 25,
        VISION_WARD: 15,
        CONTROL_WARD: 15,
        FARSIGHT_WARD: 15
    },

    COLORS: {
        TEAMS: {
            BLUE: {
                primary: 'bg-blue-700',
                border: 'border-blue-400',
                visionCircle: 'rgba(147, 197, 253, 0.4)',
            },
            RED: {
                primary: 'bg-red-700',
                border: 'border-red-400',
                visionCircle: 'rgba(252, 165, 165, 0.4)',
            },
        },

        WARDS: {
            VISION: {
                background: 'bg-yellow-400',
            },
            CONTROL: {
                background: 'bg-pink-700',
            },
            FARSIGHT: {
                background: 'bg-cyan-500',
            },
        },

        TOWERS: {
            ACTIVE: {
                BLUE: {
                    background: 'bg-blue-700',
                    border: 'border-blue-400',
                },
                RED: {
                    background: 'bg-red-700',
                    border: 'border-red-400',
                },
            },
            DESTROYED: {
                background: 'bg-gray-700',
                border: 'border-gray-400',
            },
        },
    },

    OPACITY: {
        WARD_DISABLED: 0.3,
        TOWER_DESTROYED: 0.4,
        VISION_CIRCLE: 0.4,
    },

    TEXT: {
        CHAMPION_ROLE_SIZE: 'text-[8px]',
        WARD_SYMBOL_SIZE: 'text-[10px]',
        TOWER_LABEL_SIZE: 'text-xs',
    },

    Z_INDEX: {
        FOG: 100,
        DRAWING: 50,
        WARD: 15,
        CHAMPION: 10,
        TOWER: 5,
    },

    DRAWING: {
        PEN_WIDTH: 3,
        PEN_COLOR: '#FFFFFF',
        ERASER_RADIUS: 0.015,
    },

    BORDER_WIDTH: 'border-2',
    ROUNDED: {
        CHAMPION: 'rounded-full',
        WARD: 'rounded-full',
        TOWER: 'rounded-lg',
    },
} as const;

export function getTeamColors(team: 'blue' | 'red' | 'neutral') {
    if (team === 'neutral') {
        return DISPLAY_CONFIG.COLORS.TEAMS.BLUE;
    }
    return team === 'blue' ? DISPLAY_CONFIG.COLORS.TEAMS.BLUE : DISPLAY_CONFIG.COLORS.TEAMS.RED;
}

/**
 * Helper pour obtenir les couleurs de tour
 */
export function getTowerColors(team: 'blue' | 'red', active: boolean) {
    if (!active) {
        return DISPLAY_CONFIG.COLORS.TOWERS.DESTROYED;
    }
    return team === 'blue'
        ? DISPLAY_CONFIG.COLORS.TOWERS.ACTIVE.BLUE
        : DISPLAY_CONFIG.COLORS.TOWERS.ACTIVE.RED;
}
