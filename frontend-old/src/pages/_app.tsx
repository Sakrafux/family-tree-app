import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        router.replace(window.location.pathname).then(() => setMounted(true));
    }, []);

    if (!mounted) return null;

    return (
        <div className={`${geistSans.className} ${geistMono.className}`}>
            <Component {...pageProps} />
        </div>
    );
}
