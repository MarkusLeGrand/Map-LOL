import type { ReactNode } from 'react';

interface ButtonProps {
    onClick: () => void;
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'blue' | 'red' | 'purple' | 'green' | 'yellow' | 'pink' | 'orange';
    active?: boolean;
    className?: string;
    fullWidth?: boolean;
}

export function Button({
    onClick,
    children,
    variant = 'secondary',
    active = false,
    className = '',
    fullWidth = false,
}: ButtonProps) {
    let buttonClasses = 'px-3 py-2 rounded transition-colors ';

    if (fullWidth) {
        buttonClasses += 'w-full ';
    }

    if (active) {
        if (variant === 'blue') {
            buttonClasses += 'bg-blue-700 text-white ';
        } else if (variant === 'red') {
            buttonClasses += 'bg-red-700 text-white ';
        } else if (variant === 'purple') {
            buttonClasses += 'bg-purple-700 text-white ';
        } else if (variant === 'green') {
            buttonClasses += 'bg-green-700 text-white ';
        } else if (variant === 'yellow') {
            buttonClasses += 'bg-yellow-700 text-black ';
        } else if (variant === 'pink') {
            buttonClasses += 'bg-pink-700 text-white ';
        } else if (variant === 'orange') {
            buttonClasses += 'bg-orange-700 text-white ';
        } else if (variant === 'danger') {
            buttonClasses += 'bg-red-800 text-white hover:bg-red-900 ';
        } else {
            buttonClasses += 'bg-gray-600 text-white ';
        }
    } else {
        if (variant === 'danger') {
            buttonClasses += 'bg-red-800 hover:bg-red-900 text-white ';
        } else {
            buttonClasses += 'bg-gray-700 text-gray-300 hover:bg-gray-600 ';
        }
    }

    buttonClasses += className;

    return (
        <button onClick={onClick} className={buttonClasses}>
            {children}
        </button>
    );
}
