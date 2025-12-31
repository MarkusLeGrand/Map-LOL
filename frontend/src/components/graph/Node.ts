// Node.ts
import { NODE_STATE } from './constants';

export type NodeState = typeof NODE_STATE[keyof typeof NODE_STATE];

class Node {
    id: string;
    label: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    state: NodeState;
    color: string;

    constructor(id: string, label: string, x: number, y: number, color?: string) {
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.state = NODE_STATE.DEFAULT;
        this.color = color || '#FFFFFF';
    }

    set_state(new_state: NodeState): void {
        this.state = new_state;
    }

    is_default(): boolean {
        return this.state === NODE_STATE.DEFAULT;
    }

    is_hovered(): boolean {
        return this.state === NODE_STATE.HOVER;
    }

    is_selected(): boolean {
        return this.state === NODE_STATE.SELECTED;
    }

    is_highlighted(): boolean {
        return this.state === NODE_STATE.HIGHLIGHTED;
    }

    is_dragging(): boolean {
        return this.state === NODE_STATE.DRAGGING;
    }
}

export default Node;
