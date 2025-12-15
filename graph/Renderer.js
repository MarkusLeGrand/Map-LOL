// Renderer.js
import { 
    NODE_RADIUS,
    NODE_RADIUS_HOVER,
    NODE_COLORS, 
    EDGE_COLORS, 
    EDGE_WIDTH,
    OPACITY_DIMMED,
    OPACITY_FULL,
    FONT_SIZE,
    FONT_FAMILY,
    TEXT_COLOR
} from './constants.js';

class Renderer
{
    constructor(canvas, graph)
    {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.graph = graph;
    }

    render()
    {
        this.clear_canvas();
        this.draw_edges();
        this.draw_all_nodes();
    }

    clear_canvas()
    {
        this.context.fillStyle = '#1a1a1a';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    get_active_node()
    {
        let i = 0;
        while (i < this.graph.nodes.length)
        {
            const node = this.graph.nodes[i];
            if (node.is_hovered() || node.is_dragging())
            {
                return node;
            }
            i = i + 1;
        }
        return null;
    }

    get_connected_nodes(node)
    {
        let connected = [];
        let i = 0;
        
        while (i < this.graph.edges.length)
        {
            const edge = this.graph.edges[i];
            
            if (edge.node1 === node)
            {
                connected.push(edge.node2);
            }
            
            if (edge.node2 === node)
            {
                connected.push(edge.node1);
            }
            
            i = i + 1;
        }
        
        return connected;
    }

    is_edge_connected_to_node(edge, node)
    {
        if (edge.node1 === node)
        {
            return true;
        }
        
        if (edge.node2 === node)
        {
            return true;
        }
        
        return false;
    }

    draw_edges()
    {
        const active_node = this.get_active_node();
        let i = 0;
        
        while (i < this.graph.edges.length)
        {
            const edge = this.graph.edges[i];
            const is_connected = this.is_edge_connected_to_node(edge, active_node);
            this.draw_edge(edge, active_node, is_connected);
            i = i + 1;
        }
    }

    draw_edge(edge, active_node, is_connected)
    {
        const color = EDGE_COLORS[edge.state];
        const width = EDGE_WIDTH[edge.state];
        let opacity = OPACITY_FULL;
        
        if (active_node && !is_connected)
        {
            opacity = OPACITY_DIMMED;
        }
        
        this.context.globalAlpha = opacity;
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.beginPath();
        this.context.moveTo(edge.node1.x, edge.node1.y);
        this.context.lineTo(edge.node2.x, edge.node2.y);
        this.context.stroke();
        this.context.globalAlpha = OPACITY_FULL;
    }

    draw_all_nodes()
    {
        const active_node = this.get_active_node();
        const connected_nodes = this.get_connected_nodes(active_node);
        let i = 0;
        
        while (i < this.graph.nodes.length)
        {
            const node = this.graph.nodes[i];
            const is_connected = connected_nodes.includes(node);
            this.draw_node(node, active_node, is_connected);
            i = i + 1;
        }
    }

    draw_node(node, active_node, is_connected)
    {
        const is_active = node.is_hovered() || node.is_dragging();
        const radius = is_active ? NODE_RADIUS_HOVER : NODE_RADIUS;
        let opacity = OPACITY_FULL;
        
        if (active_node && !is_connected && !is_active)
        {
            opacity = OPACITY_DIMMED;
        }
        
        this.context.globalAlpha = opacity;
        this.context.fillStyle = node.color;
        this.context.beginPath();
        this.context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        this.context.fill();
        this.context.globalAlpha = OPACITY_FULL;

        this.context.fillStyle = TEXT_COLOR;
        this.context.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
        this.context.textAlign = 'center';
        this.context.fillText(node.label, node.x, node.y + radius + 15);
    }
}

export default Renderer;
