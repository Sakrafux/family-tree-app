import { useEffect, useRef } from "react";
import * as d3 from "d3-hierarchy"; // for hierarchy, tree, etc.
import { select } from "d3-selection"; // for select, selectAll, append
import { zoom } from "d3-zoom"; // for zoom behavior
import familyData from "./family-tree.json";

// Handle Spouses: The standard tree layout shows parent-child links. To show spouses side-by-side, you need a custom layout. This is more advanced but very common.
//
// Better Node Design: Use rectangles instead of circles and include more info (birth/death years).
//
// Interactive Nodes: Make nodes clickable to expand/collapse branches or show more details.
//
// Zoom & Pan: The code above includes zoom/pan, which is essential for large trees. Users can scroll to zoom and drag to pan around.
//
// Responsive Container: The code uses w-full h-screen to make the SVG fill the screen. You can adjust this.

export interface FamilyMember {
    name: string;
    birthYear?: number; // Optional properties should be marked with '?'
    spouse?: {
        name: string;
        birthYear?: number;
    };
    children?: FamilyMember[]; // This is the recursive part that's crucial
}

const FamilyTree = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return; // Crucial check

        const svgElement = svgRef.current;
        const { width, height } = svgElement.getBoundingClientRect();

        // 2. Use the imported 'select' function, not 'd3.select'
        const svg = select(svgElement)
            .attr("width", width)
            .attr("height", height);

        // 3. Create the hierarchy and layout (using the d3 import from d3-hierarchy)
        const root = d3.hierarchy<FamilyMember>(familyData);
        const treeLayout = d3.tree<FamilyMember>().nodeSize([100, 200]);
        treeLayout(root);

        // Calculate the bounds of the tree
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;

        root.each((d) => {
            if (d.x! > x1) x1 = d.x!;
            if (d.x! < x0) x0 = d.x!;
            if (d.y! > y1) y1 = d.y!;
            if (d.y! < y0) y0 = d.y!;
        });

        // The total width and height of the tree itself
        const treeWidth = x1 - x0;
        const treeHeight = y1 - y0;

        // The dimensions of the SVG container
        const svgWidth = width;
        const svgHeight = height;

        // Calculate the offset needed to center the tree
        // We translate by:
        // x: (svgWidth - treeWidth) / 2 - the leftmost node's position (x0)
        // y: (svgHeight - treeHeight) / 2 - the topmost node's position (y0) + some top padding
        const offsetX = (svgWidth - treeWidth) / 2 - x0;
        const offsetY = (svgHeight - treeHeight) / 2 - y0 - 50; // -50 for top padding

        // 4. Setup Zoom behavior (using the imported 'zoom' function)
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (zoomEvent) => {
                // Handle the zoom event here
                // You'll need to select an internal <g> element to transform
                svg.select("g").attr("transform", zoomEvent.transform);
            });

        // 5. Apply the zoom behavior to the SVG
        svg.call(zoomBehavior);

        // Clear previous drawing
        svg.selectAll("*").remove();

        // Create a group for all zoomable elements
        const g = svg
            .append("g")
            .attr("transform", `translate(${offsetX},${offsetY})`);

        // 5. Draw links (lines between nodes)
        g.append("g")
            .selectAll("line")
            .data(root.links())
            .enter()
            .append("line")
            .attr("x1", (d) => d.source.x!)
            .attr("y1", (d) => d.source.y!)
            .attr("x2", (d) => d.target.x!)
            .attr("y2", (d) => d.target.y!)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2);

        // 6. Draw nodes
        const node = g
            .append("g")
            .selectAll("g")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);

        // Add a circle for each node
        node.append("circle").attr("r", 10).attr("fill", "#69b3a2");

        // Add a label for each node
        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", (d) => (d.children ? -12 : 12)) // position text left or right of node
            .attr("text-anchor", (d) => (d.children ? "end" : "start"))
            .text((d) => d.data.name)
            .clone(true)
            .lower() // Add a white background for readability
            .attr("stroke", "white")
            .attr("stroke-width", 3);
    }, [familyData]); // Re-run if data change

    return (
        <div className="h-full w-full overflow-hidden">
            <svg
                ref={svgRef}
                className="h-full w-full border border-gray-200"
            ></svg>
        </div>
    );
};

export default FamilyTree;
