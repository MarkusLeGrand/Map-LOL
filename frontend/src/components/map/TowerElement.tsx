import type { Tower } from '../../types';
import { DISPLAY_CONFIG, getTowerColors } from '../../config/displayConfig';
import { getTowerLabelText } from '../../utils/styleHelpers';

interface TowerElementProps {
    tower: Tower;
    boardSize: number;
    onToggle: (id: string) => void;
}

export function TowerElement({ tower, boardSize, onToggle }: TowerElementProps) {
    const x = tower.x * boardSize;
    const y = tower.y * boardSize;
    const size = DISPLAY_CONFIG.SIZES.TOWER;
    const colors = getTowerColors(tower.team, tower.active);
    const label = getTowerLabelText(tower.type);

    let towerTitle = `${tower.team} ${tower.type} - `;
    if (tower.active) {
        towerTitle += 'Active';
    } else {
        towerTitle += 'Destroyed';
    }

    let opacityClass = '';
    if (!tower.active) {
        const opacityValue = Math.round(DISPLAY_CONFIG.OPACITY.TOWER_DESTROYED * 100);
        opacityClass = `opacity-${opacityValue}`;
    }

    const containerClasses = `w-full h-full ${DISPLAY_CONFIG.ROUNDED.TOWER} ${DISPLAY_CONFIG.BORDER_WIDTH} flex items-center justify-center ${DISPLAY_CONFIG.TEXT.TOWER_LABEL_SIZE} font-bold ${colors.background} ${colors.border} ${opacityClass}`;

    return (
        <div
            onClick={() => onToggle(tower.id)}
            className="absolute select-none cursor-pointer"
            style={{
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
            }}
        >
            <div className={containerClasses} title={towerTitle}>
                {label}
            </div>
        </div>
    );
}
