import { useApiCompleteGraph } from "@/api/data/CompleteGraphProvider.tsx";
import { useEffect } from "react";

function Home() {
    const { state, getCompleteGraph } = useApiCompleteGraph();

    useEffect(() => {
        if (!state.data && !state.loading) {
            getCompleteGraph();
        }
    }, [state]);

    return (
        <div className="bg-amber-400">
            <h1>Home</h1>
            <div>{JSON.stringify(state)}</div>
        </div>
    );
}

export default Home;
