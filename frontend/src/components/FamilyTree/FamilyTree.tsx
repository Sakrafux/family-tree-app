import "./FamilyTree.css";

import * as d3 from "d3-hierarchy";
import { select, type Selection } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import { buildHourglassTree, type PersonNode } from "@/components/FamilyTree/FamilyTree.service";
import { type OnNodeClickFn, updateGraph } from "@/components/FamilyTree/FamilyTree.svg";
import { useLoading } from "@/components/Loading";
import type { FamilyTreeDto } from "@/types/dto";

type FamilyTreeProps = {
    initialId: string;
};

export const LAYOUT_WIDTH = 350;
export const LAYOUT_HEIGHT = 200;

const FamilyTree = ({ initialId }: FamilyTreeProps) => {
    const [curId, setCurId] = useState(initialId);
    const [familyTree, setFamilyTree] = useState<FamilyTreeDto>();

    const ref = useRef<SVGSVGElement>(null);
    const containerRef = useRef<Selection<SVGGElement, any, any, any>>(undefined);
    const onNodeClickRef = useRef<OnNodeClickFn>(() => {});

    const { state, getFamilyTree } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();

    const onNodeClick = useCallback(
        async (_event: any, d: d3.HierarchyPointNode<PersonNode>) => {
            const id = d.data.Id;
            showLoading();
            await getFamilyTree(id);
            hideLoading();
            setCurId(id);
        },
        [getFamilyTree, hideLoading, showLoading],
    );

    useEffect(() => {
        onNodeClickRef.current = onNodeClick;
    }, [onNodeClick]);

    useEffect(() => {
        if (state.data![curId] != null) {
            setFamilyTree(state.data![curId]);
        }
    }, [curId, state.data]);

    useEffect(() => {
        if (!ref.current || !familyTree) return;

        const svgElement = ref.current;
        const svg = select(svgElement);

        const [descendantTree, ancestorTree] = buildHourglassTree(familyTree);

        const descendantRoot = d3.hierarchy(descendantTree);
        const ancestorRoot = d3.hierarchy(ancestorTree);

        const treeLayout = d3.tree<PersonNode>().nodeSize([LAYOUT_WIDTH, LAYOUT_HEIGHT]);

        const descendantNodes = treeLayout(descendantRoot);
        const ancestorNodes = treeLayout(ancestorRoot);
        ancestorNodes.descendants().forEach((node) => (node.y = -node.y));

        if (!containerRef.current) {
            containerRef.current = svg.append("g").attr("class", "family-tree");

            // Prepare zoom
            const zoomBehavior = zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 4])
                .on("zoom", (zoomEvent) => {
                    svg.select("g").attr("transform", zoomEvent.transform);
                });
            const { width, height } = svgElement.getBoundingClientRect();
            const initialTransform = zoomIdentity.translate(width / 2, height / 2).scale(1);

            // Apply zoom
            svg.call(zoomBehavior)
                .on("dblclick.zoom", null)
                .call(zoomBehavior.transform, initialTransform);
        }

        // Enter new nodes, move updated nodes, delete old nodes
        updateGraph(containerRef.current, descendantNodes, ancestorNodes, onNodeClickRef);
    }, [familyTree, onNodeClick]); // Re-run if data change

    return (
        <div className="h-full w-full overflow-hidden">
            <svg ref={ref} className="h-full w-full"></svg>
        </div>
    );
};

export default FamilyTree;
