import type { Ward, VisionMode, WardType } from '../../types';
import { DISPLAY_CONFIG, getTeamColors } from '../../config/displayConfig';
import { getWardSize } from '../../utils/styleHelpers';

interface WardElementProps {
    ward: Ward;
    boardSize: number;
    visionMode: VisionMode;
    placingWard: WardType | null;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
}

export function WardElement({ ward, boardSize, visionMode, placingWard, onMouseDown }: WardElementProps) {
    const x = ward.x * boardSize;
    const y = ward.y * boardSize;
    const size = getWardSize(ward.type, DISPLAY_CONFIG.SIZES.VISION_WARD, DISPLAY_CONFIG.SIZES.CONTROL_WARD);
    const teamColors = getTeamColors(ward.team);

    let wardBg: string;
    if (ward.type === 'vision') {
        wardBg = DISPLAY_CONFIG.COLORS.WARDS.VISION.background;
    } else {
        wardBg = DISPLAY_CONFIG.COLORS.WARDS.CONTROL.background;
    }

    let cursorClass = 'cursor-move';
    let pointerEvents = '';
    if (placingWard) {
        cursorClass = '';
        pointerEvents = 'pointer-events-none';
    }

    let opacity = 1;
    if (ward.disabled) {
        opacity = DISPLAY_CONFIG.OPACITY.WARD_DISABLED;
    }

    let wardTitle = '';
    if (ward.disabled) {
        wardTitle = 'Disabled by Control Ward';
    }

    const wardClasses = `w-full h-full ${DISPLAY_CONFIG.ROUNDED.WARD} ${DISPLAY_CONFIG.BORDER_WIDTH} flex items-center justify-center ${DISPLAY_CONFIG.TEXT.WARD_SYMBOL_SIZE} font-bold ${wardBg} ${teamColors.border}`;

    const showVisionCircle = visionMode === 'off';

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, ward.id)}
            className={`absolute select-none ${cursorClass} ${pointerEvents}`}
            style={{
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                zIndex: DISPLAY_CONFIG.Z_INDEX.WARD,
                opacity: opacity,
            }}
            title={wardTitle}
        >
            {showVisionCircle && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed pointer-events-none"
                    style={{
                        width: ward.visionRadius * boardSize * 2,
                        height: ward.visionRadius * boardSize * 2,
                        borderColor: teamColors.visionCircle,
                    }}
                />
            )}

            <div className={wardClasses} />
        </div>
    );
}
