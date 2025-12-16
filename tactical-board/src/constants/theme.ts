/**
 * Theme Constants
 * Centralized color system and design tokens
 */

export const COLORS = {
    // Primary brand colors
    primary: '#3D7A5F',
    danger: '#A85C5C',
    blue: '#5F7A8E',
    purple: '#7A5F8E',
    gold: '#B8945E',
    pink: '#D97FB4',
    orange: '#FF7F00',

    // Base colors
    background: '#0E0E0E',
    text: '#F5F5F5',
    white: '#FFFFFF',
    black: '#000000',
} as const;

export const OPACITY = {
    border: 10,
    hover: 20,
    disabled: 30,
    secondary: 40,
    tertiary: 50,
    subtle: 60,
} as const;

/**
 * Helper to create color with opacity
 * @example withOpacity(COLORS.text, OPACITY.border) => '#F5F5F5/10'
 */
export function withOpacity(color: string, opacity: number): string {
    return `${color}/${opacity}`;
}

/**
 * Common CSS class patterns
 */
export const STYLES = {
    border: `border-[${withOpacity(COLORS.text, OPACITY.border)}]`,
    hoverBorder: `hover:border-[${withOpacity(COLORS.text, OPACITY.hover)}]`,
    textSecondary: `text-[${withOpacity(COLORS.text, OPACITY.subtle)}]`,
    textSubtle: `text-[${withOpacity(COLORS.text, OPACITY.secondary)}]`,
} as const;

export const SPACING = {
    containerMaxWidth: '1600px',
    containerPadding: 'px-12',
} as const;
