// layout.js

export function calculate_circular_layout(index, total, center_x, center_y, radius)
{
    const angle = (index * 2 * Math.PI) / total;
    
    const x = center_x + Math.cos(angle) * radius;
    const y = center_y + Math.sin(angle) * radius;
    
    return { x: x, y: y };
}

export function calculate_star_layout(nodes_count, canvas_width, canvas_height)
{
    const positions = [];

    const center_x = canvas_width / 2;
    const center_y = canvas_height / 2;

    // Augmenter le rayon pour plus d'espace
    const base_radius = Math.min(canvas_width, canvas_height) / 2.5;

    // Calculer le nombre de cercles concentriques nécessaires
    const nodes_per_circle = 6;

    let node_index = 0;
    let circle_index = 0;

    while (node_index < nodes_count)
    {
        const current_radius = circle_index === 0 ? 0 : base_radius * (circle_index * 0.6);
        const nodes_in_this_circle = circle_index === 0 ? 1 : Math.min(nodes_per_circle * circle_index, nodes_count - node_index);

        if (circle_index === 0)
        {
            // Centre
            positions.push({
                x: center_x,
                y: center_y
            });
            node_index = node_index + 1;
        }
        else
        {
            // Disposer les nœuds en cercle
            let i = 0;
            while (i < nodes_in_this_circle && node_index < nodes_count)
            {
                const angle = (i * 2 * Math.PI) / nodes_in_this_circle;
                // Ajouter un offset pour que les cercles ne se chevauchent pas
                const offset_angle = (circle_index % 2) * (Math.PI / nodes_in_this_circle);

                const x = center_x + Math.cos(angle + offset_angle) * current_radius;
                const y = center_y + Math.sin(angle + offset_angle) * current_radius;

                positions.push({ x: x, y: y });

                node_index = node_index + 1;
                i = i + 1;
            }
        }

        circle_index = circle_index + 1;
    }

    return positions;
}
