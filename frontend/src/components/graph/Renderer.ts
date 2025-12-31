// Renderer.ts
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
} from './constants';
import Graph from './Graph';
import Node from './Node';
import Edge from './Edge';

class Renderer {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    graph: Graph;

    constructor(canvas: HTMLCanvasElement, graph: Graph) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.context = ctx;
        this.graph = graph;
    }

    render(): void {
        this.clear_canvas();
        this.draw_edges();
        this.draw_all_nodes();
    }

    clear_canvas(): void {
        this.context.fillStyle = '#1a1a1a';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    get_active_node(): Node | null {
        let i = 0;
        while (i < this.graph.nodes.length) {
            const node = this.graph.nodes[i];
            if (node.is_hovered() || node.is_dragging()) {
                return node;
            }
            i = i + 1;
        }
        return null;
    }

    get_connected_nodes(node: Node | null): Node[] {
        if (!node) return [];

        let connected: Node[] = [];
        let i = 0;

        while (i < this.graph.edges.length) {
            const edge = this.graph.edges[i];

            if (edge.node1 === node) {
                connected.push(edge.node2);
            }

            if (edge.node2 === node) {
                connected.push(edge.node1);
            }

            i = i + 1;
        }

        return connected;
    }

    is_edge_connected_to_node(edge: Edge, node: Node | null): boolean {
        if (!node) return false;

        if (edge.node1 === node) {
            return true;
        }

        if (edge.node2 === node) {
            return true;
        }

        return false;
    }

    draw_edges(): void {
        const active_node = this.get_active_node();
        let i = 0;

        while (i < this.graph.edges.length) {
            const edge = this.graph.edges[i];
            const is_connected = this.is_edge_connected_to_node(edge, active_node);
            this.draw_edge(edge, active_node, is_connected);
            i = i + 1;
        }
    }

    draw_edge(edge: Edge, active_node: Node | null, is_connected: boolean): void {
        const color = EDGE_COLORS[edge.state];
        const width = EDGE_WIDTH[edge.state];
        let opacity = OPACITY_FULL;

        if (active_node && !is_connected) {
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

    draw_all_nodes(): void {
        const active_node = this.get_active_node();
        const connected_nodes = this.get_connected_nodes(active_node);
        let i = 0;

        while (i < this.graph.nodes.length) {
            const node = this.graph.nodes[i];
            const is_connected = connected_nodes.includes(node);
            this.draw_node(node, active_node, is_connected);
            i = i + 1;
        }
    }

    draw_node(node: Node, active_node: Node | null, is_connected: boolean): void {
        const is_active = node.is_hovered() || node.is_dragging();
        const radius = is_active ? NODE_RADIUS_HOVER : NODE_RADIUS;
        let opacity = OPACITY_FULL;

        if (active_node && !is_connected && !is_active) {
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
