import { useMemo } from 'react';
import type { Faelight, Ward, FaelightActivation } from '../types';
import { calculateFaelightActivations } from '../utils/faelightCalculations';

/**
 * Hook to calculate which Faelights are currently activated by wards.
 * Memoized to prevent recalculation on every render.
 */
export function useFaelightActivations(faelights: Faelight[], wards: Ward[]): FaelightActivation[] {
    const activations = useMemo(() => {
        return calculateFaelightActivations(faelights, wards);
    }, [faelights, wards]);

    return activations;
}
