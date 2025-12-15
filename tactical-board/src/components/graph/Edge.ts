// Edge.ts
import { EDGE_STATE } from './constants';
import Node from './Node';

export type EdgeState = typeof EDGE_STATE[keyof typeof EDGE_STATE];

class Edge {
    node1: Node;
    node2: Node;
    state: EdgeState;

    constructor(node1: Node, node2: Node) {
        this.node1 = node1;
        this.node2 = node2;
        this.state = EDGE_STATE.DEFAULT;
    }

    set_state(new_state: EdgeState): void {
        this.state = new_state;
    }

    is_default(): boolean {
        return this.state === EDGE_STATE.DEFAULT;
    }

    is_highlighted(): boolean {
        return this.state === EDGE_STATE.HIGHLIGHTED;
    }
}

export default Edge;
