/**
 * Configuration centralisée de l'affichage visuel
 * Tailles, couleurs, opacités, styles pour tous les éléments de la carte
 */

export const DISPLAY_CONFIG = {
    // =========================
    // TAILLES (en pixels)
    // =========================
    SIZES: {
        // Tokens de champions
        CHAMPION_TOKEN: 22.5,

        // Tours
        TOWER: 25,

        // Wards
        VISION_WARD: 20,   // Ward jaune
        CONTROL_WARD: 20,  // Ward rose/pink
    },

    // =========================
    // COULEURS
    // =========================
    COLORS: {
        // Équipes
        TEAMS: {
            BLUE: {
                primary: 'bg-blue-500',
                border: 'border-blue-300',
                visionCircle: 'rgba(147, 197, 253, 0.4)', // Bleu clair semi-transparent
            },
            RED: {
                primary: 'bg-red-500',
                border: 'border-red-300',
                visionCircle: 'rgba(252, 165, 165, 0.4)', // Rouge clair semi-transparent
            },
        },

        // Wards
        WARDS: {
            VISION: {
                background: 'bg-yellow-400',
            },
            CONTROL: {
                background: 'bg-pink-500',
            },
        },

        // Tours
        TOWERS: {
            ACTIVE: {
                BLUE: {
                    background: 'bg-blue-600',
                    border: 'border-blue-400',
                },
                RED: {
                    background: 'bg-red-600',
                    border: 'border-red-400',
                },
            },
            DESTROYED: {
                background: 'bg-gray-600',
                border: 'border-gray-400',
            },
        },
    },

    // =========================
    // OPACITÉS
    // =========================
    OPACITY: {
        WARD_DISABLED: 0.3,      // Ward désactivée par Control Ward ennemie
        TOWER_DESTROYED: 0.4,    // Tour détruite
        VISION_CIRCLE: 0.4,      // Cercle de vision en pointillé
    },

    // =========================
    // STYLES TEXTE
    // =========================
    TEXT: {
        CHAMPION_ROLE_SIZE: 'text-[8px]',   // Taille du texte pour rôle du champion
        WARD_SYMBOL_SIZE: 'text-[10px]',    // Taille du symbole sur ward
        TOWER_LABEL_SIZE: 'text-xs',        // Taille du label de tour (T1, T2, etc.)
    },

    // =========================
    // Z-INDEX
    // =========================
    Z_INDEX: {
        FOG: 100,          // Fog of war au-dessus de tout
        WARD: 15,          // Wards au-dessus des tokens
        CHAMPION: 10,      // Champions
        TOWER: 5,          // Tours en dessous
    },

    // =========================
    // AUTRES CONSTANTES VISUELLES
    // =========================
    BORDER_WIDTH: 'border-2',
    ROUNDED: {
        CHAMPION: 'rounded-full',
        WARD: 'rounded-full',
        TOWER: 'rounded-lg',
    },
} as const;

/**
 * Helper pour obtenir les couleurs d'équipe
 */
export function getTeamColors(team: 'blue' | 'red' | 'neutral') {
    if (team === 'neutral') {
        // Pour les tokens neutres, utiliser les couleurs bleues par défaut
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
