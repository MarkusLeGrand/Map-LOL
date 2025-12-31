import { useEffect, useRef } from 'react';
import Graph from './Graph';
import Renderer from './Renderer';
import PhysicsEngine from './PhysicsEngine';
import { calculate_star_layout } from './layout';
import { NODE_STATE } from './constants';

interface Tool {
  name: string;
  description: string;
  status: string;
  color: string;
  onClick?: string;
  category: string;
}

interface ToolsGraphVisualizerProps {
  tools: Tool[];
  onToolClick?: (toolId: string) => void;
}

function ToolsGraphVisualizer({ tools, onToolClick }: ToolsGraphVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const physicsRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const mouseDownPositionRef = useRef({ x: 0, y: 0 });
  const dragThresholdRef = useRef(5);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (tools.length > 0) {
      initVisualization();
      startAnimationLoop();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (physicsRef.current) {
        physicsRef.current.stop();
      }
    };
  }, [tools]);

  function initVisualization() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (graphRef.current) {
      if (physicsRef.current) {
        physicsRef.current.stop();
      }
    }

    const graph = new Graph();
    graphRef.current = graph;

    const renderer = new Renderer(canvas, graph);
    rendererRef.current = renderer;

    const physics = new PhysicsEngine(graph);
    physics.start();
    physicsRef.current = physics;

    const positions = calculate_star_layout(
      tools.length,
      canvas.width,
      canvas.height
    );

    // Add all tools as nodes
    let i = 0;
    while (i < tools.length) {
      const tool = tools[i];
      const pos = positions[i];

      const toolFormatted = {
        id: tool.name,
        name: tool.name,
        folderId: tool.category,
        language: null,
        description: tool.description,
        links: []
      };

      graph.add_node_from_project(toolFormatted, pos.x, pos.y, tool.color);
      i = i + 1;
    }

    // Connect tools by category
    i = 0;
    while (i < tools.length) {
      const tool1 = tools[i];
      const sourceNode = graph.get_node_by_id(tool1.name);

      if (sourceNode === null) {
        i = i + 1;
        continue;
      }

      // Connect to other tools in the same category
      let j = i + 1;
      while (j < tools.length) {
        const tool2 = tools[j];

        if (tool1.category === tool2.category) {
          const targetNode = graph.get_node_by_id(tool2.name);

          if (targetNode !== null) {
            graph.connect_nodes(sourceNode, targetNode);
          }
        }

        j = j + 1;
      }

      i = i + 1;
    }

    setupMouseEvents(canvas, graph);
  }

  function startAnimationLoop() {
    function animate() {
      const physics = physicsRef.current;
      const renderer = rendererRef.current;

      if (physics) {
        physics.update();
      }

      if (renderer) {
        renderer.render();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  }

  function setupMouseEvents(canvas: HTMLCanvasElement, graph: any) {
    let mouseX = 0;
    let mouseY = 0;
    let hoveredNode: any = null;
    let draggedNode: any = null;

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      mouseX = (event.clientX - rect.left) * scaleX;
      mouseY = (event.clientY - rect.top) * scaleY;

      if (draggedNode !== null) {
        const dx = mouseX - mouseDownPositionRef.current.x;
        const dy = mouseY - mouseDownPositionRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > dragThresholdRef.current) {
          hasMovedRef.current = true;
        }

        draggedNode.x = mouseX;
        draggedNode.y = mouseY;
        return;
      }

      const node = graph.get_node_at_position(mouseX, mouseY);

      if (node !== hoveredNode) {
        if (hoveredNode !== null) {
          hoveredNode.set_state(NODE_STATE.DEFAULT);
        }

        hoveredNode = node;

        if (hoveredNode !== null) {
          hoveredNode.set_state(NODE_STATE.HOVER);
        }
      }
    });

    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      mouseX = (event.clientX - rect.left) * scaleX;
      mouseY = (event.clientY - rect.top) * scaleY;

      mouseDownPositionRef.current = { x: mouseX, y: mouseY };
      hasMovedRef.current = false;

      const node = graph.get_node_at_position(mouseX, mouseY);

      if (node !== null) {
        draggedNode = node;
        draggedNode.set_state(NODE_STATE.DRAGGING);
      }
    });

    canvas.addEventListener('mouseup', (event) => {
      if (draggedNode !== null) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        const node = graph.get_node_at_position(mouseX, mouseY);

        if (node === draggedNode) {
          draggedNode.set_state(NODE_STATE.HOVER);
          hoveredNode = draggedNode;
        } else {
          draggedNode.set_state(NODE_STATE.DEFAULT);
        }

        draggedNode = null;
      }

      hasMovedRef.current = false;
    });

    canvas.addEventListener('mouseleave', () => {
      if (hoveredNode !== null) {
        hoveredNode.set_state(NODE_STATE.DEFAULT);
        hoveredNode = null;
      }

      if (draggedNode !== null) {
        draggedNode.set_state(NODE_STATE.DEFAULT);
        draggedNode = null;
      }
    });

    canvas.addEventListener('dblclick', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (event.clientX - rect.left) * scaleX;
      const mouseY = (event.clientY - rect.top) * scaleY;

      const node = graph.get_node_at_position(mouseX, mouseY);

      if (node !== null && onToolClick) {
        // Find the tool with this name
        const tool = tools.find(t => t.name === node.id);
        if (tool && tool.onClick) {
          onToolClick(tool.onClick);
        }
      }
    });
  }

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        backgroundColor: '#0E0E0E'
      }}
    />
  );
}

export default ToolsGraphVisualizer;
