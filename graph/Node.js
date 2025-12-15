// Node.js
import { NODE_STATE } from './constants.js';

class Node
{
    constructor(id, label, x, y, color)
    {
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.state = NODE_STATE.DEFAULT;
        this.color = color || '#FFFFFF';
    }

    set_state(new_state)
    {
        this.state = new_state;
    }

    is_default()
    {
        return this.state === NODE_STATE.DEFAULT;
    }

    is_hovered()
    {
        return this.state === NODE_STATE.HOVER;
    }

    is_selected()
    {
        return this.state === NODE_STATE.SELECTED;
    }

    is_highlighted()
    {
        return this.state === NODE_STATE.HIGHLIGHTED;
    }

    is_dragging()
    {
        return this.state === NODE_STATE.DRAGGING;
    }
}

export default Node;
