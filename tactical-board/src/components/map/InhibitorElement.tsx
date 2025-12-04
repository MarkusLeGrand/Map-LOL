import React from 'react';
import type { Inhibitor } from '../../types';

interface InhibitorElementProps {
    inhibitor: Inhibitor;
    mapWidth: number;
    mapHeight: number;
    onClick?: (inhibitorId: string) => void;
}

const getInhibitorColors = (team: Inhibitor['team']) => {
    const baseColors = {
        blue: {
            background: 'bg-blue-700',
            border: 'border-blue-400',
        },
        red: {
            background: 'bg-red-700',
            border: 'border-red-400',
        },
    };
    return baseColors[team];
};

export const InhibitorElement: React.FC<InhibitorElementProps> = ({ inhibitor, mapWidth, mapHeight, onClick }) => {
    const size = 24;
    const x = inhibitor.x * mapWidth - size / 2;
    const y = inhibitor.y * mapHeight - size / 2;
    const colors = getInhibitorColors(inhibitor.team);

    const opacityClass = inhibitor.active ? '' : 'opacity-40';
    const containerClasses = `w-full h-full rounded-full border-2 flex items-center justify-center text-xs font-bold ${colors.background} ${colors.border} ${opacityClass}`;

    return (
        <div
            className="absolute cursor-pointer select-none"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
            }}
            onClick={() => onClick?.(inhibitor.id)}
            title={`${inhibitor.team} ${inhibitor.lane} inhibitor - ${inhibitor.active ? 'Active' : 'Destroyed'}`}
        >
            <div className={containerClasses}>
                I
            </div>
            {inhibitor.respawnTime && (
                <div
                    className="absolute top-0 right-0 bg-black bg-opacity-75 text-white text-xs rounded px-1"
                    style={{ fontSize: '10px' }}
                >
                    {Math.ceil(inhibitor.respawnTime / 1000)}s
                </div>
            )}
        </div>
    );
};
