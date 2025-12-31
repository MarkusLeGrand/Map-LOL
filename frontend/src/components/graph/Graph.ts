// Graph.ts

import Node from './Node';
import Edge from './Edge';
import { is_point_in_circle } from './utils';
import { NODE_RADIUS, NODE_STATE, EDGE_STATE } from './constants';

export interface Project {
    id: string;
    name: string;
    folderId?: string | null;
    language?: string | null;
    description?: string;
    links?: string[];
}

class Graph {
    nodes: Node[];
    edges: Edge[];

    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    get_node_by_id(id: string): Node | null {
        let i = 0;

        while (i < this.nodes.length) {
            const node = this.nodes[i];

            if (node.id === id) {
                return node;
            }

            i = i + 1;
        }

        return null;
    }

    connect_nodes(node1: Node, node2: Node): void {
        const edge = new Edge(node1, node2);
        this.add_edge(edge);
    }

    add_node(node: Node): void {
        this.nodes.push(node);
    }

    add_edge(edge: Edge): void {
        this.edges.push(edge);
    }

    add_node_from_project(project: Project, x: number, y: number, color?: string): Node {
        const node = new Node(project.id, project.name, x, y, color);
        this.add_node(node);
        return node;
    }

    get_node_at_position(x: number, y: number): Node | null {
        let i = 0;

        while (i < this.nodes.length) {
            const node = this.nodes[i];

            if (is_point_in_circle(x, y, node.x, node.y, NODE_RADIUS)) {
                return node;
            }

            i = i + 1;
        }

        return null;
    }

    get_connected_nodes(node: Node): Node[] {
        const connected: Node[] = [];
        let i = 0;

        while (i < this.edges.length) {
            const edge = this.edges[i];

            if (edge.node1 === node) {
                connected.push(edge.node2);
            } else if (edge.node2 === node) {
                connected.push(edge.node1);
            }

            i = i + 1;
        }

        return connected;
    }

    clear_all_states(): void {
        let i = 0;

        while (i < this.nodes.length) {
            this.nodes[i].set_state(NODE_STATE.DEFAULT);
            i = i + 1;
        }

        i = 0;
        while (i < this.edges.length) {
            this.edges[i].set_state(EDGE_STATE.DEFAULT);
            i = i + 1;
        }
    }
}

export default Graph;
