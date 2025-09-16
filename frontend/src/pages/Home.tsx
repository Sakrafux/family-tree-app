import { useEffect } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import { useAuth } from "@/api/security/AuthProvider";
import FamilyTree from "@/components/FamilyTree";
import FeedbackOverlay from "@/components/FeedbackOverlay";
import { useLoading } from "@/components/LoadingProvider";

const ID_TO_QUERY = import.meta.env.VITE_DEFAULT_FAMILY_TREE_ID;

function Home() {
    const { state, getFamilyTree, clearError } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();
    const {
        state: { data: token },
    } = useAuth();

    // Load the initial family tree
    useEffect(() => {
        if (!state.data && !state.loading && !state.error) {
            showLoading(true);
            getFamilyTree(token?.nodeId ?? ID_TO_QUERY).then(() => hideLoading());
        }
    }, [getFamilyTree, hideLoading, showLoading, state, token?.nodeId]);

    useEffect(() => {
        clearError();
    }, [clearError]);

    if (!state.data) return null;

    return (
        <main className="full-wo-header-height w-full">
            <FamilyTree initialId={token?.nodeId ?? ID_TO_QUERY} />
            <FeedbackOverlay />
        </main>
    );
}

export default Home;
