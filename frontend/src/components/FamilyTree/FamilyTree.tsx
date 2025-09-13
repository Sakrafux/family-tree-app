import "./FamilyTree.css";

import * as d3 from "d3-hierarchy";
import { select } from "d3-selection";
import { zoom, zoomIdentity, ZoomTransform } from "d3-zoom";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import {
    LAYOUT_HEIGHT,
    LAYOUT_WIDTH,
    TRANSITION_DURATION,
} from "@/components/FamilyTree/FamilyTree.constant";
import {
    buildHourglassTree,
    calculateBounds,
    createAncestorSpouseLink,
    createDescendantSpouseLinks,
    createSiblingLinks,
    createSiblingNodes,
    createSpouseLinks,
    createSpouseNodes,
} from "@/components/FamilyTree/FamilyTree.service";
import { updateGraph } from "@/components/FamilyTree/FamilyTree.svg";
import type {
    MinHierarchyNode,
    OnNodeClickFn,
    PersonNode,
} from "@/components/FamilyTree/FamilyTree.type";
import { useLoading } from "@/components/LoadingProvider";
import type { FamilyTreeDto } from "@/types";

type FamilyTreeProps = {
    // Initial node to select
    initialId: string;
};

function FamilyTree({ initialId }: FamilyTreeProps) {
    // We need to keep track of the selected tree, as the context caches all fetched trees, and we
    // must select the one we want
    const [curId, setCurId] = useState(initialId);
    // State variable for the selected tree from the context
    const [familyTree, setFamilyTree] = useState<FamilyTreeDto>();

    // Refs for the DOM elements for access
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<SVGGElement>(null);
    // Ref to keep track of the latest ZoomTransform to have access to the latest zoom level
    const zoomRef = useRef<ZoomTransform>(undefined);
    // Ref for node click callback, as the elements that use the callback are not managed by React
    // and may have a long life-cycle, thus we give them a ref, which we can update from the
    // React side, and they have access to the current method
    const onNodeClickRef = useRef<OnNodeClickFn>(() => {});

    const { state, getFamilyTree } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();

    // Handles a click on a node, which triggers a fetch of a new family-tree based on the clicked
    // node as new root, which eventually causes the graph to reload and update
    const onNodeClick = useCallback(
        async (_event: any, d: MinHierarchyNode<PersonNode>) => {
            const id = d.data.Id;
            showLoading();
            // Fetch the new family-tree based on the clicked node
            await getFamilyTree(id);
            hideLoading();
            // Set the clicked node's id as the tree selector
            setCurId(id);
        },
        // getFamilyTree is also updated if the state is updated, thus the callback actually changes
        // This is why the ref is necessary
        [getFamilyTree, hideLoading, showLoading],
    );

    // Ensure the ref always has the current callback
    useEffect(() => {
        onNodeClickRef.current = onNodeClick;
    }, [onNodeClick]);

    // Load the specific family tree from the state based on the selected node's id
    useEffect(() => {
        if (state.data![curId] != null) {
            setFamilyTree(state.data![curId]);
        }
    }, [curId, state.data]);

    useEffect(() => {
        // Ensure <svg> and <g> nodes are bound and data is fetched
        if (!svgRef.current || !containerRef.current || !familyTree) return;

        // D3 Selection of underlying DOM-nodes
        const svg = select(svgRef.current);
        const container = select(containerRef.current);

        // Properly structure the data for D3
        const [descendantTree, ancestorTree] = buildHourglassTree(familyTree);

        // Let D3 construct its nodes based on the structured data
        const descendantRoot = d3.hierarchy(descendantTree);
        const ancestorRoot = d3.hierarchy(ancestorTree);

        // Create a layout engine
        // `nodeSize` defines how much horizontal/vertical space is calculated for the nodes, which
        // needs to consider the size of the nodes we want to display, as well as any other elements
        // which require space to properly display (e.g. marriages)
        const treeLayout = d3.tree<PersonNode>().nodeSize([LAYOUT_WIDTH, LAYOUT_HEIGHT]);

        // Use the layout engine to calculate the proper node positions
        const descendantNodes = treeLayout(descendantRoot);
        const ancestorNodes = treeLayout(ancestorRoot);
        // Since D3 doesn't know that we want an upside-down tree (with root at the bottom), we
        // need to turn it upside-down ourselves
        ancestorNodes.descendants().forEach((node) => (node.y = -node.y));

        // Alias the root nodes (same nodes, but different trees)
        const rootNodeDescendant = descendantNodes;
        const rootNodeAncestor = ancestorNodes;

        // Construct the nodes and links of the siblings of the root without D3, since it doesn't fit a tree
        const siblingNodes = createSiblingNodes(familyTree);
        const siblingLinks = createSiblingLinks(rootNodeDescendant, siblingNodes);

        // Construct the nodes and links of the spouses of the root without D3, since it doesn't fit a tree
        const spouseNodes = createSpouseNodes(familyTree);
        const spouseLinks = createSpouseLinks(rootNodeDescendant, spouseNodes);

        // Construct additional links for spouses of descendants/ancestor, since for D3 they are
        // simply child nodes, but are semantically different for us
        const descendantSpouseLinks = createDescendantSpouseLinks(rootNodeDescendant);
        const ancestorSpouseLinks = createAncestorSpouseLink(rootNodeAncestor);

        // Combine all nodes and links into a common array each
        // The order of items defines their rendering priority, i.e. later elements overlay earlier ones
        const nodes = [
            rootNodeDescendant,
            ...descendantNodes.descendants().slice(1),
            ...ancestorNodes.descendants().slice(1),
            ...siblingNodes,
            ...spouseNodes,
        ];
        const links = [
            ...descendantNodes.links(),
            ...ancestorNodes.links(),
            ...siblingLinks,
            ...spouseLinks,
            ...descendantSpouseLinks,
            ...ancestorSpouseLinks,
        ];

        // Calculate the viewing bounds
        const { width, height } = svgRef.current.getBoundingClientRect();
        const [[x0, y0], [x1, y1]] = calculateBounds(nodes, width, height);

        // Prepare zoom (includes moving the graph)
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            // Set the possible degree of zoom
            .scaleExtent([0.1, 4])
            // Apply viewing bounds
            .translateExtent([
                [x0, y0],
                [x1, y1],
            ])
            // Callback on zooming and moving the graph
            // Triggered both by the user and through programmatic calls
            .on("zoom", (zoomEvent) => {
                // In case of a programmatic call that is not the initial call (i.e. zoomRef is set)
                if (zoomEvent.sourceEvent == null && zoomRef.current != null) {
                    // Apply the transform with a transition to prevent jarring cuts
                    // Despite moving the graph, as it counteracts the transitions of the updated
                    // nodes, the screen appears to be still while the new root moves into place
                    svg.select("g")
                        .transition()
                        .duration(TRANSITION_DURATION)
                        .attr("transform", zoomEvent.transform);
                    // Otherwise (i.e. mouse-events), we don't want to interfere and simply apply the movement
                    // The initial rendering should also appear immediately instead of a transition
                } else {
                    svg.select("g").attr("transform", zoomEvent.transform);
                }
                // Keep track of the current zoom, i.e. x,y + scale
                zoomRef.current = zoomEvent.transform;
            });

        // Calculate the initial view of a new (or updated) graph
        const initialTransform = zoomIdentity
            // As 0,0 is the origin of the graph, but located in the upper-left corner, we need to
            // move the view in order to look at the graph root (i.e. the point of interest)
            // We use the center of the screen (or rather the svg root) as the target
            .translate(width / 2, height / 2)
            // For graph updates, we don't want to change our zoom level and thus use it from the ref
            .scale(zoomRef.current?.k ?? 1);
        // We need to call the ZoomBehavior to actually apply it (and thus its event handlers, e.g. mouse)
        svg.call(zoomBehavior)
            // We don't want double click to actually do anything as it is easily confused with
            // simple clicks, which we use for selecting nodes
            .on("dblclick.zoom", null)
            // This call to the transform applies our centering and implicitly calls the "zoom" handler
            .call(zoomBehavior.transform, initialTransform);

        // Enter new nodes, update moved nodes, delete old nodes
        updateGraph(container, nodes, links, onNodeClickRef);
    }, [familyTree, onNodeClick]); // Only "familyTree" is expected to change

    // <div> to ensure no issues with overflow
    // <svg> as effective viewing port
    // <g> to contain the graph and move it as a whole inside the "viewing port"
    return (
        <div className="h-full w-full overflow-hidden">
            <svg ref={svgRef} className="h-full w-full">
                <g ref={containerRef} className="family-tree"></g>
            </svg>
        </div>
    );
}

export default FamilyTree;
