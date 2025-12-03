import React from 'react';
import type { JungleCamp as JungleCampType } from '../../types';

interface JungleCampProps {
    camp: JungleCampType;
    mapWidth: number;
    mapHeight: number;
    onClick?: (campId: string) => void;
}

const campIcons: Record<JungleCampType['type'], string> = {
    'baron': '🐉',
    'dragon': '🐲',
    'herald': '👁️',
    'blue-buff': '🔵',
    'red-buff': '🔴',
    'gromp': '🐸',
    'wolves': '🐺',
    'raptors': '🦅',
    'krugs': '🪨',
};

const campColors: Record<JungleCampType['team'], string> = {
    'blue': '#3b82f6',
    'red': '#ef4444',
    'neutral': '#a855f7',
};

export const JungleCamp: React.FC<JungleCampProps> = ({ camp, mapWidth, mapHeight, onClick }) => {
    const size = camp.type === 'baron' || camp.type === 'dragon' || camp.type === 'herald' ? 40 : 30;
    const x = camp.x * mapWidth - size / 2;
    const y = camp.y * mapHeight - size / 2;

    return (
        <div
            className="absolute cursor-pointer transition-all hover:scale-110"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: camp.active ? 1 : 0.4,
                filter: camp.active ? 'none' : 'grayscale(100%)',
            }}
            onClick={() => onClick?.(camp.id)}
            title={`${camp.type} (${camp.team})`}
        >
            <div
                className="w-full h-full rounded-full flex items-center justify-center text-xl"
                style={{
                    backgroundColor: campColors[camp.team],
                    border: `2px solid ${camp.active ? '#fff' : '#666'}`,
                    boxShadow: camp.active ? '0 0 10px rgba(0,0,0,0.5)' : 'none',
                }}
            >
                {campIcons[camp.type]}
            </div>
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
