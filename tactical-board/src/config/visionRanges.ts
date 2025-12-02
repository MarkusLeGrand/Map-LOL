/**
 * Configuration centralisée des portées de vision
 * Toutes les valeurs sont en pourcentage de la taille du board (0-1)
 */

export const VISION_RANGES = {
    // Champions
    CHAMPION: 0.08, // 8% du board

    // Wards
    VISION_WARD: 0.07,   // 5% du board (jaune)
    CONTROL_WARD: 0.07, // 5.5% du board (rose/pink)

    // Tours (par type)
    TOWERS: {
        outer:  0.084375,      // T1 - Tours extérieures
        inner: 0.11,      // T2 - Tours intérieures
        inhibitor: 0.11,  // T3 - Tours d'inhibiteur
        nexus: 0.11,      // T4 - Tours du nexus
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
