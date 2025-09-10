import type { PropsWithChildren } from "react";
import { FamilyTreeProvider } from "@/api/data/FamilyTreeProvider.tsx";

const providers = [FamilyTreeProvider];

export function DataProviders({ children }: PropsWithChildren) {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children,
    );
}
