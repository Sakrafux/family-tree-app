import { useCallback, useEffect, useRef } from "react";
import * as d3 from "d3-hierarchy";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import {
    buildHourglassTree,
    type PersonNode,
} from "@/components/FamilyTree/FamilyTree.service.ts";
import type { FamilyTreeDto } from "@/types/dto.ts";
import { fillGraph } from "@/components/FamilyTree/FamilyTree.svg.ts";
import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider.tsx";
import "./FamilyTree.css";

type FamilyTreeProps = {
    familyTree: FamilyTreeDto;
};

export const LAYOUT_WIDTH = 350;
export const LAYOUT_HEIGHT = 200;

const FamilyTree = ({ familyTree }: FamilyTreeProps) => {
    const ref = useRef<SVGSVGElement>(null);

    const { getFamilyTree } = useApiFamilyTree();

    const changeRoot = useCallback(
        (id: string) => {
            getFamilyTree(id);
        },
        [getFamilyTree],
    );

    useEffect(() => {
        if (!ref.current || !familyTree) return;

        const svgElement = ref.current;
        const svg = select(svgElement);

        const [descendantTree, ancestorTree] = buildHourglassTree(familyTree);

        const descendantRoot = d3.hierarchy(descendantTree);
        const ancestorRoot = d3.hierarchy(ancestorTree);

        const treeLayout = d3
            .tree<PersonNode>()
            .nodeSize([LAYOUT_WIDTH, LAYOUT_HEIGHT]);

        const descendantNodes = treeLayout(descendantRoot);
        const ancestorNodes = treeLayout(ancestorRoot);

        const { width, height } = svgElement.getBoundingClientRect();
        const initialTransform = zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1); // Start at scale 1 (no zoom)

        // Prepare zoom
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (zoomEvent) => {
                svg.select("g").attr("transform", zoomEvent.transform);
            });

        // TODO do some transition instead of deleting everything
        // Clear previous graph
        svg.selectAll("*").remove();

        // Create root graph element
        const g = svg.append("g");
        // Apply zoom
        svg.call(zoomBehavior).call(zoomBehavior.transform, initialTransform);

        // Fill graph with all new nodes
        fillGraph(g, descendantNodes, ancestorNodes, (_event, d) =>
            changeRoot(d.data.Id),
        );
    }, [familyTree, changeRoot]); // Re-run if data change

    return (
        <div className="h-full w-full overflow-hidden">
            <svg ref={ref} className="h-full w-full"></svg>
        </div>
    );
};

export default FamilyTree;
