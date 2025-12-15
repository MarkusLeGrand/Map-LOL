import React, { useEffect, useRef, useState } from 'react';
import Graph from './Graph.js';
import Renderer from './Renderer.js';
import PhysicsEngine from './PhysicsEngine.js';
import { calculate_star_layout } from './layout.js';
import { NODE_STATE } from './constants.js';
import { fetchProjects, fetchFolders } from '../../data/api.js';

function GraphVisualizer({ onProjectSelect })
{
    const canvas_ref = useRef(null);
    const graph_ref = useRef(null);
    const renderer_ref = useRef(null);
    const physics_ref = useRef(null);
    const animation_ref = useRef(null);
    const mouse_down_position_ref = useRef({ x: 0, y: 0 });
    const drag_threshold_ref = useRef(5);
    const has_moved_ref = useRef(false);

    const [projects, set_projects] = useState([]);
    const [folders, set_folders] = useState([]);
    const [loading, set_loading] = useState(true);

    useEffect(() =>
    {
        load_data();

        return () =>
        {
            if (animation_ref.current)
            {
                cancelAnimationFrame(animation_ref.current);
            }
            if (physics_ref.current)
            {
                physics_ref.current.stop();
            }
        };
    }, []);

    useEffect(() =>
    {
        if (projects.length > 0 && folders.length > 0)
        {
            init_visualization();
            start_animation_loop();
        }
    }, [projects, folders]);

    function load_data()
    {
        Promise.all([fetchProjects(), fetchFolders()])
            .then(function([projects_data, folders_data])
            {
                set_projects(projects_data);
                set_folders(folders_data);
                set_loading(false);
            })
            .catch(function(error)
            {
                console.error('Error loading data:', error);
                set_loading(false);
            });
    }

        function open_project(project_id)
        {
            if (onProjectSelect)
            {
                onProjectSelect(project_id);
            }
        }

        function get_folder_color(folder_id)
        {
            if (folder_id === null || folder_id === undefined)
            {
                return '#FFFFFF';
            }

            let i = 0;
            while (i < folders.length)
            {
                const folder = folders[i];

                if (folder.id === folder_id)
                {
                    if (folder.color)
                    {
                        return folder.color;
                    }
                    return '#FFFFFF';
                }

                i = i + 1;
            }

            return '#FFFFFF';
        }

    function init_visualization()
    {
        const canvas = canvas_ref.current;

        if (graph_ref.current)
        {
            if (physics_ref.current)
            {
                physics_ref.current.stop();
            }
        }

        const graph = new Graph();
        graph_ref.current = graph;

        const renderer = new Renderer(canvas, graph);
        renderer_ref.current = renderer;

        const physics = new PhysicsEngine(graph);
        physics.start();
        physics_ref.current = physics;

        const positions = calculate_star_layout(
            projects.length,
            canvas.width,
            canvas.height
        );

        let i = 0;
        while (i < projects.length)
        {
            const project = projects[i];
            const pos = positions[i];
            const folder_color = get_folder_color(project.folder_id);
            
            const project_formatted = {
                id: project.id,
                name: project.title,
                folderId: project.folder_id,
                language: project.technologies ? project.technologies[0] : null,
                description: project.description,
                links: []
            };

            graph.add_node_from_project(project_formatted, pos.x, pos.y, folder_color);
            i = i + 1;
        }
        i = 0;
        while (i < projects.length)
        {
            const project = projects[i];
            const source_node = graph.get_node_by_id(project.id);

            if (source_node === null)
            {
                i = i + 1;
                continue;
            }

            if (project.links && Array.isArray(project.links) && project.links.length > 0)
            {
                let j = 0;
                while (j < project.links.length)
                {
                    const linked_project_id = project.links[j];
                    const target_node = graph.get_node_by_id(linked_project_id);

                    if (target_node !== null)
                    {
                        graph.connect_nodes(source_node, target_node);
                    }

                    j = j + 1;
                }
            }

            i = i + 1;
        }

        setup_mouse_events(canvas, graph, renderer);
    }


    function start_animation_loop()
    {
        function animate()
        {
            const physics = physics_ref.current;
            const renderer = renderer_ref.current;

            if (physics)
            {
                physics.update();
            }

            if (renderer)
            {
                renderer.render();
            }

            animation_ref.current = requestAnimationFrame(animate);
        }

        animate();
    }

    function setup_mouse_events(canvas, graph, renderer)
    {
        let mouse_x = 0;
        let mouse_y = 0;
        let hovered_node = null;
        let dragged_node = null;

        canvas.addEventListener('mousemove', (event) =>
        {
            const rect = canvas.getBoundingClientRect();
            const scale_x = canvas.width / rect.width;
            const scale_y = canvas.height / rect.height;

            mouse_x = (event.clientX - rect.left) * scale_x;
            mouse_y = (event.clientY - rect.top) * scale_y;

            if (dragged_node !== null)
            {
                const dx = mouse_x - mouse_down_position_ref.current.x;
                const dy = mouse_y - mouse_down_position_ref.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > drag_threshold_ref.current)
                {
                    has_moved_ref.current = true;
                }

                dragged_node.x = mouse_x;
                dragged_node.y = mouse_y;
                return;
            }

            const node = graph.get_node_at_position(mouse_x, mouse_y);

            if (node !== hovered_node)
            {
                if (hovered_node !== null)
                {
                    hovered_node.set_state(NODE_STATE.DEFAULT);
                }

                hovered_node = node;

                if (hovered_node !== null)
                {
                    hovered_node.set_state(NODE_STATE.HOVER);
                }
            }
        });

        canvas.addEventListener('mousedown', (event) =>
        {
            const rect = canvas.getBoundingClientRect();
            const scale_x = canvas.width / rect.width;
            const scale_y = canvas.height / rect.height;

            mouse_x = (event.clientX - rect.left) * scale_x;
            mouse_y = (event.clientY - rect.top) * scale_y;

            mouse_down_position_ref.current = { x: mouse_x, y: mouse_y };
            has_moved_ref.current = false;

            const node = graph.get_node_at_position(mouse_x, mouse_y);

            if (node !== null)
            {
                dragged_node = node;
                dragged_node.set_state(NODE_STATE.DRAGGING);
            }
        });

        canvas.addEventListener('mouseup', (event) =>
        {
            if (dragged_node !== null)
            {
                const rect = canvas.getBoundingClientRect();
                const scale_x = canvas.width / rect.width;
                const scale_y = canvas.height / rect.height;

                const mouse_x = (event.clientX - rect.left) * scale_x;
                const mouse_y = (event.clientY - rect.top) * scale_y;

                const node = graph.get_node_at_position(mouse_x, mouse_y);

                if (node === dragged_node)
                {
                    dragged_node.set_state(NODE_STATE.HOVER);
                    hovered_node = dragged_node;
                }
                else
                {
                    dragged_node.set_state(NODE_STATE.DEFAULT);
                }

                dragged_node = null;
            }

            has_moved_ref.current = false;
        });

        canvas.addEventListener('mouseleave', () =>
        {
            if (hovered_node !== null)
            {
                hovered_node.set_state(NODE_STATE.DEFAULT);
                hovered_node = null;
            }

            if (dragged_node !== null)
            {
                dragged_node.set_state(NODE_STATE.DEFAULT);
                dragged_node = null;
            }
        });

        canvas.addEventListener('dblclick', (event) =>
        {
            const rect = canvas.getBoundingClientRect();
            const scale_x = canvas.width / rect.width;
            const scale_y = canvas.height / rect.height;

            const mouse_x = (event.clientX - rect.left) * scale_x;
            const mouse_y = (event.clientY - rect.top) * scale_y;

            const node = graph.get_node_at_position(mouse_x, mouse_y);

            if (node !== null)
            {
                open_project(node.id);
            }
        });
    }

    if (loading)
    {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                Chargement du graph...
            </div>
        );
    }

    return (
        <canvas
            ref={canvas_ref}
            width={1920}
            height={1080}
            style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block'
            }}
        />
    );


}

export default GraphVisualizer;
