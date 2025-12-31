import { useMemo } from 'react';
import type { Token, Ward, VisionMode } from '../types';
import {
    calculateWardsWithDisabledStatus,
    isTokenAlly,
    isWardAlly,
    isTokenInVision,
    isInBrush,
    hasControlWardInBrush,
    hasAllyTokenInBrush,
    isVisionWardRevealedByControlWard,
    isControlWardDisablingAllyVisionWard,
} from '../utils/visionCalculations';

interface UseVisibleEntitiesProps {
    tokens: Token[];
    wards: Ward[];
    visionMode: VisionMode;
    visionData: ImageData | null;
    brushData: ImageData | null;
    boardSize: number;
}

export function useVisibleEntities({
    tokens,
    wards,
    visionMode,
    visionData,
    brushData,
    boardSize,
}: UseVisibleEntitiesProps) {
    const wardsWithDisabledStatus = useMemo(() => {
        return calculateWardsWithDisabledStatus(wards);
    }, [wards]);

    const visibleTokens = useMemo(() => {
        if (visionMode === 'off' || !visionData || !brushData) {
            return tokens;
        }

        return tokens.map(token => {
            if (isTokenAlly(token, visionMode)) {
                return { ...token, isVisible: true };
            }

            const inVision = isTokenInVision(token, visionData, boardSize);
            const inBrush = isInBrush(token.x, token.y, brushData);

            let allyInSameBrush = false;
            if (inBrush) {
                const hasControlWard = hasControlWardInBrush(
                    token,
                    wardsWithDisabledStatus,
                    visionMode,
                    brushData
                );

                if (hasControlWard) {
                    allyInSameBrush = true;
                } else {
                    allyInSameBrush = hasAllyTokenInBrush(token, tokens, visionMode, brushData);
                }
            }

            return { ...token, isVisible: inVision || allyInSameBrush };
        });
    }, [tokens, visionMode, visionData, brushData, boardSize, wardsWithDisabledStatus]);

    const visibleWards = useMemo(() => {
        if (visionMode === 'off') {
            return wardsWithDisabledStatus;
        }

        return wardsWithDisabledStatus.filter(ward => {
            if (isWardAlly(ward, visionMode)) {
                return true;
            }

            if (ward.type === 'vision') {
                return isVisionWardRevealedByControlWard(ward, wardsWithDisabledStatus, visionMode);
            }

            if (ward.type === 'control') {
                return isControlWardDisablingAllyVisionWard(ward, wardsWithDisabledStatus, visionMode);
            }

            return false;
        });
    }, [wardsWithDisabledStatus, visionMode]);

    return {
        wardsWithDisabledStatus,
        visibleTokens,
        visibleWards,
    };
}
