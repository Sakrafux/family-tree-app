import Link from "next/link";
import { useRouter } from "next/router";

export default function Some() {
    const router = useRouter();

    return (
        <div>
            <div>ID: {router.query.someId}</div>
            <Link href="/">Home</Link>
        </div>
    );
}
