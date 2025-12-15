// Edge.js
import { EDGE_STATE } from './constants.js';

class Edge
{
    constructor(node1, node2)
    {
        this.node1 = node1;
        this.node2 = node2;
        this.state = EDGE_STATE.DEFAULT;
    }

    set_state(new_state)
    {
        this.state = new_state;
    }

    is_default()
    {
        return this.state === EDGE_STATE.DEFAULT;
    }

    is_highlighted()
    {
        return this.state === EDGE_STATE.HIGHLIGHTED;
    }
}

export default Edge;
