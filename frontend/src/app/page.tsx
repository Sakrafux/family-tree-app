import Image from "next/image";

export default async function Home() {
    const data = await fetchGraph();

    return (
        <div className="p-4">
            <h1>Fetched JSON</h1>
            <pre>{JSON.stringify(data, null, 4)}</pre>
        </div>
    );
}

async function fetchGraph() {
    const res = await fetch(
        "http://localhost:8080/api/graph/complete?auth=admin",
        {
            next: { revalidate: 60 }, // optional: ISR, 60 seconds
        },
    );
    if (!res.ok) {
        throw new Error("Failed to fetch data");
    }
    return res.json();
}
