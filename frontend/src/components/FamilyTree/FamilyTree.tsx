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
    const curZoom = useRef<{ x: number; y: number; k: number }>(undefined);

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
        ancestorNodes.descendants().forEach((node) => (node.y = -node.y));

        if (curZoom.current == null) {
            const { width, height } = svgElement.getBoundingClientRect();
            curZoom.current = { x: width / 2, y: height / 2, k: 1 };
        }
        const initialTransform = zoomIdentity
            .translate(curZoom.current.x, curZoom.current.y)
            .scale(curZoom.current.k);

        // Prepare zoom
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (zoomEvent) => {
                curZoom.current = zoomEvent.transform;
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
        fillGraph(g, descendantNodes, ancestorNodes, (_event, d) => {
            const scale = curZoom.current!.k;
            curZoom.current = {
                x: curZoom.current!.x + d.x * scale,
                y: curZoom.current!.y + d.y * scale,
                k: curZoom.current!.k,
            };
            changeRoot(d.data.Id);
        });
    }, [familyTree, changeRoot]); // Re-run if data change

    return (
        <div className="h-full w-full overflow-hidden">
            <svg ref={ref} className="h-full w-full"></svg>
        </div>
    );
};

export default FamilyTree;
