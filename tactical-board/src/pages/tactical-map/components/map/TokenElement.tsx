import type { Token } from '../../types';
import { DISPLAY_CONFIG, getTeamColors } from '../../config/displayConfig';

interface TokenElementProps {
    token: Token;
    boardSize: number;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    showCoordinates?: boolean;
}

export function TokenElement({ token, boardSize, onMouseDown, showCoordinates }: TokenElementProps) {
    const x = token.x * boardSize;
    const y = token.y * boardSize;
    const size = DISPLAY_CONFIG.SIZES.CHAMPION_TOKEN;
    const teamColors = getTeamColors(token.team);
    const roleInitial = token.role.charAt(0);

    const containerClasses = `w-full h-full ${DISPLAY_CONFIG.ROUNDED.CHAMPION} ${DISPLAY_CONFIG.BORDER_WIDTH} flex items-center justify-center ${DISPLAY_CONFIG.TEXT.CHAMPION_ROLE_SIZE} font-bold ${teamColors.primary} ${teamColors.border}`;

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, token.id)}
            className="absolute cursor-move select-none"
            style={{
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                zIndex: DISPLAY_CONFIG.Z_INDEX.CHAMPION,
            }}
        >
            <div className={containerClasses}>
                {roleInitial}
            </div>
            {showCoordinates && (
                <div
                    className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                    style={{ zIndex: DISPLAY_CONFIG.Z_INDEX.CHAMPION + 1 }}
                >
                    x: {token.x.toFixed(3)}, y: {token.y.toFixed(3)}
                </div>
            )}
        </div>
    );
}
