import { useApiCompleteGraph } from "@/api/data/CompleteGraphProvider.tsx";
import { useEffect } from "react";
import FamilyTree from "@/components/FamilyTree.tsx";

function Home() {
    const { state, getCompleteGraph } = useApiCompleteGraph();

    useEffect(() => {
        if (!state.data && !state.loading) {
            getCompleteGraph();
        }
    }, [state]);

    return (
        <main className="full-wo-header-height w-full">
            <FamilyTree />
        </main>
    );
}

export default Home;
