import type { PropsWithChildren } from "react";

import { FamilyTreeProvider } from "@/api/data/FamilyTreeProvider";
import { FeedbackProvider } from "@/api/data/FeedbackProvider";

const providers = [FamilyTreeProvider, FeedbackProvider];

export function DataProviders({ children }: PropsWithChildren) {
    return providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
}
