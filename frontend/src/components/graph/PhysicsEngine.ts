// PhysicsEngine.ts

import { SPRING_STIFFNESS, DAMPING, REST_LENGTH, NODE_RADIUS, REPULSION_STRENGTH, REPULSION_DISTANCE } from './constants';
import Graph from './Graph';
import Node from './Node';
import Edge from './Edge';

class PhysicsEngine {
    graph: Graph;
    is_running: boolean;

    constructor(graph: Graph) {
        this.graph = graph;
        this.is_running = false;
    }

    start(): void {
        this.is_running = true;
    }

    stop(): void {
        this.is_running = false;
    }

    update(): void {
        if (this.is_running === false) {
            return;
        }

        this.apply_spring_forces();
        this.apply_repulsion_forces();
        this.apply_collision_forces();
        this.update_positions();
    }

    apply_spring_forces(): void {
        let i = 0;

        while (i < this.graph.nodes.length) {
            this.graph.nodes[i].vx = 0;
            this.graph.nodes[i].vy = 0;
            i = i + 1;
        }

        i = 0;

        while (i < this.graph.edges.length) {
            const edge = this.graph.edges[i];
            this.apply_spring_force(edge);
            i = i + 1;
        }
    }

    apply_spring_force(edge: Edge): void {
        const node1 = edge.node1;
        const node2 = edge.node2;

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;

        const current_distance = Math.sqrt(dx * dx + dy * dy);

        if (current_distance === 0) {
            return;
        }

        const displacement = current_distance - REST_LENGTH;
        const force_magnitude = displacement * SPRING_STIFFNESS;

        const force_x = (dx / current_distance) * force_magnitude;
        const force_y = (dy / current_distance) * force_magnitude;

        if (node1.is_dragging() === false) {
            node1.vx = node1.vx + force_x;
            node1.vy = node1.vy + force_y;
        }

        if (node2.is_dragging() === false) {
            node2.vx = node2.vx - force_x;
            node2.vy = node2.vy - force_y;
        }
    }

    apply_repulsion_forces(): void {
        let i = 0;

        while (i < this.graph.nodes.length) {
            let j = i + 1;

            while (j < this.graph.nodes.length) {
                this.apply_repulsion_force(this.graph.nodes[i], this.graph.nodes[j]);
                j = j + 1;
            }

            i = i + 1;
        }
    }

    apply_repulsion_force(node1: Node, node2: Node): void {
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0 || distance > REPULSION_DISTANCE) {
            return;
        }

        const force_magnitude = REPULSION_STRENGTH / (distance * distance);

        const force_x = (dx / distance) * force_magnitude;
        const force_y = (dy / distance) * force_magnitude;

        if (node1.is_dragging() === false) {
            node1.vx = node1.vx - force_x;
            node1.vy = node1.vy - force_y;
        }

        if (node2.is_dragging() === false) {
            node2.vx = node2.vx + force_x;
            node2.vy = node2.vy + force_y;
        }
    }

    apply_collision_forces(): void {
        const collision_radius = NODE_RADIUS * 8;
        let i = 0;

        while (i < this.graph.nodes.length) {
            let j = i + 1;

            while (j < this.graph.nodes.length) {
                this.check_collision(this.graph.nodes[i], this.graph.nodes[j], collision_radius);
                j = j + 1;
            }

            i = i + 1;
        }
    }

    check_collision(node1: Node, node2: Node, collision_radius: number): void {
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < collision_radius && distance > 0) {
            const overlap = collision_radius - distance;
            const force_magnitude = overlap * 0.5;

            const force_x = (dx / distance) * force_magnitude;
            const force_y = (dy / distance) * force_magnitude;

            if (node1.is_dragging() === false) {
                node1.vx = node1.vx - force_x;
                node1.vy = node1.vy - force_y;
            }

            if (node2.is_dragging() === false) {
                node2.vx = node2.vx + force_x;
                node2.vy = node2.vy + force_y;
            }
        }
    }

    update_positions(): void {
        let i = 0;

        while (i < this.graph.nodes.length) {
            const node = this.graph.nodes[i];

            if (node.is_dragging() === false) {
                node.x = node.x + node.vx;
                node.y = node.y + node.vy;

                node.vx = node.vx * DAMPING;
                node.vy = node.vy * DAMPING;
            }

            i = i + 1;
        }
    }
}

export default PhysicsEngine;
