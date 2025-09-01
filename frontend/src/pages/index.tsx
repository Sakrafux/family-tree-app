import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
    const [data, setData] = useState("");

    useEffect(() => {
        fetchGraph().then((results) => setData(results));
    }, []);

    return (
        <main className="p-4">
            <Link href="/about">To About</Link>
            <Link href="/some/1">To Some 1</Link>
            <h1>Fetched JSON</h1>
            <pre>{JSON.stringify(data, null, 4)}</pre>
        </main>
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
