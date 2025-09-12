import { useEffect } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import FamilyTree from "@/components/FamilyTree";
import FeedbackOverlay from "@/components/FeedbackOverlay";
import { useLoading } from "@/components/Loading";

// TODO initial node via login?
const ID_TO_QUERY = "01992bc2-416b-73d9-abe5-830fc8b141d8";

function Home() {
    const { state, getFamilyTree } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();

    useEffect(() => {
        if (!state.data && !state.loading) {
            showLoading(true);
            getFamilyTree(ID_TO_QUERY).then(() => hideLoading());
        }
    }, [getFamilyTree, hideLoading, showLoading, state]);

    if (!state.data) return null;

    return (
        <main className="full-wo-header-height w-full">
            <FamilyTree initialId={ID_TO_QUERY} />
            <FeedbackOverlay />
        </main>
    );
}

export default Home;
