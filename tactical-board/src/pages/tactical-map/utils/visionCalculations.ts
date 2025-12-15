import type { Ward, Token, VisionMode } from '../types';
import { VISION_RANGES } from '../config/visionRanges';

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export function calculateWardsWithDisabledStatus(wards: Ward[]): Ward[] {
    return wards.map(ward => {
        if (ward.type === 'control') {
            return { ...ward, disabled: false };
        }

        const isDisabled = wards.some(enemyWard => {
            if (enemyWard.type !== 'control') {
                return false;
            }
            if (enemyWard.team === ward.team) {
                return false;
            }
            if (!enemyWard.active) {
                return false;
            }

            const dist = calculateDistance(ward.x, ward.y, enemyWard.x, enemyWard.y);
            return dist <= enemyWard.visionRadius;
        });

        return { ...ward, disabled: isDisabled };
    });
}

export function isTokenAlly(token: Token, visionMode: VisionMode): boolean {
    if (visionMode === 'both') {
        return true;
    }
    if (visionMode === 'blue' && token.team === 'blue') {
        return true;
    }
    if (visionMode === 'red' && token.team === 'red') {
        return true;
    }
    return false;
}

export function isWardAlly(ward: Ward, visionMode: VisionMode): boolean {
    if (visionMode === 'both') {
        return true;
    }
    if (visionMode === 'blue' && ward.team === 'blue') {
        return true;
    }
    if (visionMode === 'red' && ward.team === 'red') {
        return true;
    }
    return false;
}

export function isTokenInVision(
    token: Token,
    visionData: ImageData,
    boardSize: number
): boolean {
    const x = Math.floor(token.x * boardSize);
    const y = Math.floor(token.y * boardSize);
    const idx = (y * boardSize + x) * 4;
    return visionData.data[idx] > 0;
}

export function isInBrush(
    x: number,
    y: number,
    brushData: ImageData
): boolean {
    const brushIdx = Math.floor(y * 512) * 512 + Math.floor(x * 512);
    const brushPixelIdx = brushIdx * 4;
    return brushData.data[brushPixelIdx] > 128;
}

export function hasControlWardInBrush(
    token: Token,
    wards: Ward[],
    visionMode: VisionMode,
    brushData: ImageData
): boolean {
    return wards.some(ward => {
        if (ward.type !== 'control' || !ward.active || ward.disabled) {
            return false;
        }

        if (!isWardAlly(ward, visionMode)) {
            return false;
        }

        const wardInBrush = isInBrush(ward.x, ward.y, brushData);
        if (!wardInBrush) {
            return false;
        }

        const dist = calculateDistance(token.x, token.y, ward.x, ward.y);
        return dist < VISION_RANGES.SAME_BRUSH_RADIUS;
    });
}

export function hasAllyTokenInBrush(
    token: Token,
    tokens: Token[],
    visionMode: VisionMode,
    brushData: ImageData
): boolean {
    for (const allyToken of tokens) {
        if (!isTokenAlly(allyToken, visionMode)) {
            continue;
        }

        const allyInBrush = isInBrush(allyToken.x, allyToken.y, brushData);
        if (!allyInBrush) {
            continue;
        }

        const dist = calculateDistance(token.x, token.y, allyToken.x, allyToken.y);
        if (dist < VISION_RANGES.SAME_BRUSH_RADIUS) {
            return true;
        }
    }

    return false;
}

export function isVisionWardRevealedByControlWard(
    ward: Ward,
    wards: Ward[],
    visionMode: VisionMode
): boolean {
    return wards.some(allyWard => {
        if (allyWard.type !== 'control') {
            return false;
        }
        if (!allyWard.active || allyWard.disabled) {
            return false;
        }
        if (!isWardAlly(allyWard, visionMode)) {
            return false;
        }

        const dist = calculateDistance(ward.x, ward.y, allyWard.x, allyWard.y);
        return dist <= allyWard.visionRadius;
    });
}

export function isControlWardDisablingAllyVisionWard(
    ward: Ward,
    wards: Ward[],
    visionMode: VisionMode
): boolean {
    return wards.some(allyWard => {
        if (allyWard.type !== 'vision') {
            return false;
        }
        if (!isWardAlly(allyWard, visionMode)) {
            return false;
        }
        if (!allyWard.disabled) {
            return false;
        }

        const dist = calculateDistance(ward.x, ward.y, allyWard.x, allyWard.y);
        return dist <= ward.visionRadius;
    });
}
