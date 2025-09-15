import { useEffect } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import FamilyTree from "@/components/FamilyTree";
import FeedbackOverlay from "@/components/FeedbackOverlay";
import { useLoading } from "@/components/LoadingProvider";

// TODO initial node via login?
const ID_TO_QUERY = import.meta.env.VITE_DEFAULT_FAMILY_TREE_ID;

function Home() {
    const { state, getFamilyTree } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();

    // Load the initial family tree
    useEffect(() => {
        if (!state.data && !state.loading && !state.error) {
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
