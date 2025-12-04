import React from 'react';
import type { JungleCamp as JungleCampType } from '../../types';

interface JungleCampProps {
    camp: JungleCampType;
    mapWidth: number;
    mapHeight: number;
    onClick?: (campId: string) => void;
}

const getCampColors = (team: JungleCampType['team']) => {
    const baseColors = {
        blue: {
            background: 'bg-blue-600',
            border: 'border-blue-400',
        },
        red: {
            background: 'bg-red-600',
            border: 'border-red-400',
        },
        neutral: {
            background: 'bg-purple-500',
            border: 'border-purple-300',
        },
    };
    return baseColors[team];
};

export const JungleCamp: React.FC<JungleCampProps> = ({ camp, mapWidth, mapHeight, onClick }) => {
    const size = 16;
    const x = camp.x * mapWidth - size / 2;
    const y = camp.y * mapHeight - size / 2;
    const colors = getCampColors(camp.team);

    const opacityClass = camp.active ? '' : 'opacity-40';
    const containerClasses = `w-full h-full border-2 flex items-center justify-center ${colors.background} ${colors.border} ${opacityClass}`;

    return (
        <div
            className="absolute cursor-pointer select-none"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
            }}
            onClick={() => onClick?.(camp.id)}
            title={`${camp.type} (${camp.team})`}
        >
            <div
                className={containerClasses}
                style={{
                    transform: 'rotate(45deg)',
                }}
            />
            {camp.respawnTime && (
                <div
                    className="absolute top-0 right-0 bg-black bg-opacity-75 text-white text-xs rounded px-1"
                    style={{ fontSize: '10px' }}
                >
                    {Math.ceil(camp.respawnTime / 1000)}s
                </div>
            )}
        </div>
    );
};
