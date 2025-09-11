import { useEffect } from "react";

import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider";
import FamilyTree from "@/components/FamilyTree";
import { useLoading } from "@/components/Loading";

function Home() {
    const { state, getFamilyTree } = useApiFamilyTree();
    const { showLoading, hideLoading } = useLoading();

    useEffect(() => {
        if (!state.data && !state.loading) {
            showLoading(true);
            // TODO initial node via login?
            getFamilyTree("01992bc2-416b-73d9-abe5-830fc8b141d8").then(() => hideLoading());
        }
    }, [getFamilyTree, hideLoading, showLoading, state]);

    if (!state.data) return null;

    return (
        <main className="full-wo-header-height w-full">
            <FamilyTree familyTree={state.data} />
        </main>
    );
}

export default Home;
