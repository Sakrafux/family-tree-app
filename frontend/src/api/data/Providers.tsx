import type { PropsWithChildren } from "react";
import { CompleteGraphProvider } from "@/api/data/CompleteGraphProvider.tsx";

const providers = [CompleteGraphProvider];

export function DataProviders({ children }: PropsWithChildren) {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children,
    );
}
