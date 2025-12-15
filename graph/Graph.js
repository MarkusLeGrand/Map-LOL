// Graph.js

import Node from './Node.js';
import Edge from './Edge.js';
import { is_point_in_circle } from './utils.js';
import { NODE_RADIUS, NODE_STATE } from './constants.js';

class Graph
{
    constructor()
    {
        this.nodes = [];
        this.edges = [];
    }

    get_node_by_id(id)
    {
        let i = 0;
        
        while (i < this.nodes.length)
        {
            const node = this.nodes[i];
            
            if (node.id === id)
            {
                return node;
            }
            
            i = i + 1;
        }
        
        return null;
    }

    connect_nodes(node1, node2)
    {
        const edge = new Edge(node1, node2);
        this.add_edge(edge);
    }

    add_node(node)
    {
        this.nodes.push(node);
    }

    add_edge(edge)
    {
        this.edges.push(edge);
    }

    add_node_from_project(project, x, y, color)
    {
        const node = new Node(project.id, project.name, x, y, color);
        this.add_node(node);
        return node;
    }

    get_node_at_position(x, y)
    {
        let i = 0;
        
        while (i < this.nodes.length)
        {
            const node = this.nodes[i];
            
            if (is_point_in_circle(x, y, node.x, node.y, NODE_RADIUS))
            {
                return node;
            }
            
            i = i + 1;
        }
        
        return null;
    }

    get_connected_nodes(node)
    {
        const connected = [];
        let i = 0;
        
        while (i < this.edges.length)
        {
            const edge = this.edges[i];
            
            if (edge.node1 === node)
            {
                connected.push(edge.node2);
            }
            else if (edge.node2 === node)
            {
                connected.push(edge.node1);
            }
            
            i = i + 1;
        }
        
        return connected;
    }

    clear_all_states()
    {
        let i = 0;
        
        while (i < this.nodes.length)
        {
            this.nodes[i].set_state(NODE_STATE.DEFAULT);
            i = i + 1;
        }
        
        i = 0;
        while (i < this.edges.length)
        {
            this.edges[i].set_state('default');
            i = i + 1;
        }
    }
}

export default Graph;
