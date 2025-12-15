// utils.ts

import { GRID_SPACING, GRID_MARGIN } from './constants';
import Node from './Node';

export function calculate_distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
}

export function is_point_in_circle(point_x: number, point_y: number, circle_x: number, circle_y: number, radius: number): boolean {
    const distance = calculate_distance(point_x, point_y, circle_x, circle_y);

    return distance < radius;
}

export function calculate_grid_position(index: number, total: number, canvas_width: number, canvas_height: number): { x: number; y: number } {
    const cols = Math.floor((canvas_width - 2 * GRID_MARGIN) / GRID_SPACING);
    const row = Math.floor(index / cols);
    const col = index % cols;

    const x = GRID_MARGIN + col * GRID_SPACING;
    const y = GRID_MARGIN + row * GRID_SPACING;

    return { x: x, y: y };
}

export function constrain_movement(node: Node, target_x: number, target_y: number, connected_nodes: Node[], max_length: number): { x: number; y: number } {
    let final_x = target_x;
    let final_y = target_y;
    let i = 0;

    while (i < connected_nodes.length) {
        const connected = connected_nodes[i];
        const distance = calculate_distance(target_x, target_y, connected.x, connected.y);

        if (distance > max_length) {
            const ratio = max_length / distance;
            const constrained_x = connected.x + (target_x - connected.x) * ratio;
            const constrained_y = connected.y + (target_y - connected.y) * ratio;

            final_x = constrained_x;
            final_y = constrained_y;
        }

        i = i + 1;
    }

    return { x: final_x, y: final_y };
}
