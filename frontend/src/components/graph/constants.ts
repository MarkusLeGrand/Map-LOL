// constants.js

// === Nodes ===
export const NODE_RADIUS = 8;
export const NODE_RADIUS_HOVER = 12;

export const NODE_STATE = {
    DEFAULT: 'default',
    HOVER: 'hover',
    SELECTED: 'selected',
    HIGHLIGHTED: 'highlighted',
    DRAGGING: 'dragging'
};

export const NODE_COLORS = {
    default: '#FFFFFF',
    hover: '#8b5cf6',
    selected: '#2563eb',
    highlighted: '#8b5cf6',
    dragging: '#8b5cf6'
};

export const NODE_BORDER_COLOR = '#1e40af';
export const NODE_BORDER_WIDTH = 1;

// === Edges ===
export const EDGE_STATE = {
    DEFAULT: 'default',
    HIGHLIGHTED: 'highlighted'
};

export const EDGE_COLORS = {
    default: '#FFFFFF',
    highlighted: '#8b5cf6'
};

export const EDGE_WIDTH = {
    default: 0.5,
    highlighted: 1.5
};

// === Opacity ===
export const OPACITY_DIMMED = 0.15;
export const OPACITY_FULL = 1.0;

// === Text ===
export const FONT_SIZE = 12;
export const FONT_FAMILY = 'monospace';
export const TEXT_COLOR = '#ffffff';

// === Grid ===
export const GRID_SPACING = 150;
export const GRID_MARGIN = 100;

// === Physics ===
export const SPRING_STIFFNESS = 0.01;
export const DAMPING = 0.85;
export const REST_LENGTH = 200;
export const REPULSION_STRENGTH = 8000;
export const REPULSION_DISTANCE = 150;
