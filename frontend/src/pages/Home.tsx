import { useApiFamilyTree } from "@/api/data/FamilyTreeProvider.tsx";
import { useEffect } from "react";
import FamilyTree from "@/components/FamilyTree";

function Home() {
    const { state, getFamilyTree } = useApiFamilyTree();

    useEffect(() => {
        if (!state.data && !state.loading) {
            // TODO initial node via login?
            getFamilyTree("01992bc2-416b-73d9-abe5-830fc8b141d8");
        }
    }, [state]);

    // TODO add special handling for loading, i.e. dont hide canvas but loading overlay or something
    if (!state.data) {
        return (
            <main className="text-container">
                <h1>Loading...</h1>
            </main>
        );
    }

    return (
        <main className="full-wo-header-height w-full">
            <FamilyTree familyTree={state.data} />
        </main>
    );
}

export default Home;
