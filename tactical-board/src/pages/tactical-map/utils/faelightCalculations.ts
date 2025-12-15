import type { Faelight, Ward, FaelightActivation } from '../types';
import { calculateDistance } from './visionCalculations';

/**
 * Determines which Faelights are activated by current wards.
 * Only active, non-disabled wards can activate Faelights.
 * Both vision wards and control wards can activate Faelights.
 * Each team can activate a Faelight independently.
 */
export function calculateFaelightActivations(
    faelights: Faelight[],
    wards: Ward[]
): FaelightActivation[] {
    const activations: FaelightActivation[] = [];

    faelights.forEach(faelight => {
        wards.forEach(ward => {
            // Only active, non-disabled wards can activate Faelights
            if (!ward.active || ward.disabled) return;

            const dist = calculateDistance(ward.x, ward.y, faelight.x, faelight.y);

            if (dist <= faelight.detectionRadius) {
                // Check if this team already has an activation for this Faelight
                const existingActivation = activations.find(
                    a => a.faelightId === faelight.id && a.team === ward.team
                );

                if (!existingActivation) {
                    activations.push({
                        faelightId: faelight.id,
                        team: ward.team,
                        activatingWardId: ward.id
                    });
                }
            }
        });
    });

    return activations;
}

/**
 * Get activations for a specific team.
 */
export function getTeamActivations(
    activations: FaelightActivation[],
    team: 'blue' | 'red'
): FaelightActivation[] {
    return activations.filter(a => a.team === team);
}
