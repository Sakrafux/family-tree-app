import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider.tsx";
import { useEffect } from "react";
import FamilyTree from "@/components/FamilyTree";

function Home() {
    const { state, getFamilyTree } = useApiFamilyTree();

    useEffect(() => {
        if (!state.data && !state.loading) {
            getFamilyTree();
        }
    }, [state]);

    if (!state.data) return null;

    return (
        <main className="full-wo-header-height w-full">
            <FamilyTree familyTree={state.data} />
        </main>
    );
}

export default Home;
