/**
 * Configuration centralisée des portées de vision
 * Toutes les valeurs sont en pourcentage de la taille du board (0-1)
 */

export const VISION_RANGES = {
    // Champions
    CHAMPION: 0.085, // 1350unit

    // Wards
    VISION_WARD: 0.055,   // 900 OK
    CONTROL_WARD: 0.055, // 900 OK
    
    // Tours (par type)
    TOWERS: {
        outer:  0.09,      // 1350
        inner: 0.09,      // 1350
        inhibitor: 0.095,  // 1350
        nexus: 0.10,      // 1350
    },

    // Distance pour détection "même brush" (proximité)
    SAME_BRUSH_RADIUS: 0.05, // 5% - pour Control Ward révélant ennemis dans brush
} as const;

/**
 * Helper pour obtenir la portée de vision d'une tour selon son type
 */
export function getTowerVisionRange(towerType: 'outer' | 'inner' | 'inhibitor' | 'nexus'): number {
    return VISION_RANGES.TOWERS[towerType];
}
