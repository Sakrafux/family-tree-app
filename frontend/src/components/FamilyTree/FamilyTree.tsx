import "./FamilyTree.css";

import * as d3 from "d3-hierarchy";
import { select, type Selection } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { useCallback, useEffect, useRef } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import { buildHourglassTree, type PersonNode } from "@/components/FamilyTree/FamilyTree.service";
import { updateGraph } from "@/components/FamilyTree/FamilyTree.svg";
import { useLoading } from "@/components/Loading";
import type { FamilyTreeDto } from "@/types/dto";

type FamilyTreeProps = {
    familyTree: FamilyTreeDto;
};

export const LAYOUT_WIDTH = 350;
export const LAYOUT_HEIGHT = 200;

const FamilyTree = ({ familyTree }: FamilyTreeProps) => {
    const ref = useRef<SVGSVGElement>(null);
    // const containerRef = useRef<SVGGElement>(null);
    const containerRef = useRef<Selection<SVGGElement, any, any, any>>(undefined);
    const zoomRef = useRef<{ x: number; y: number; k: number }>(undefined);

    const { getFamilyTree } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();

    const changeRoot = useCallback(
        async (id: string) => {
            showLoading();
            await getFamilyTree(id);
            hideLoading();
        },
        [getFamilyTree, hideLoading, showLoading],
    );

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

        if (zoomRef.current == null) {
            const { width, height } = svgElement.getBoundingClientRect();
            zoomRef.current = { x: width / 2, y: height / 2, k: 1 };
        }
        const initialTransform = zoomIdentity
            .translate(zoomRef.current.x, zoomRef.current.y)
            .scale(zoomRef.current.k);

        // Prepare zoom
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (zoomEvent) => {
                zoomRef.current = zoomEvent.transform;
                svg.select("g").attr("transform", zoomEvent.transform);
            });

        if (!containerRef.current) {
            containerRef.current = svg.append("g").attr("class", "family-tree");
            // Apply zoom
            svg.call(zoomBehavior)
                .on("dblclick.zoom", null)
                .call(zoomBehavior.transform, initialTransform);
        }

        // Enter new nodes, move updated nodes, delete old nodes
        updateGraph(containerRef.current, descendantNodes, ancestorNodes, (_event, d) => {
            const scale = zoomRef.current!.k;
            zoomRef.current = {
                x: zoomRef.current!.x + d.x * scale,
                y: zoomRef.current!.y + d.y * scale,
                k: zoomRef.current!.k,
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
