import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useApiFeedback } from "@/api/data/FeedbackProvider";
import { useLoading } from "@/components/LoadingProvider";

function Feedback() {
    const { state, getAllFeedbacks, patchFeedbackResolve, clearError } = useApiFeedback();
    const { showLoading, hideLoading } = useLoading();
    const { t } = useTranslation();

    const feedbacks = useMemo(() => {
        if (state.data == null) {
            return [];
        }
        return Object.values(state.data).sort((a, b) => {
            if (a.IsResolved && b.IsResolved) {
                return a.Id - b.Id;
            }
            if (a.IsResolved) {
                return 1;
            }
            if (b.IsResolved) {
                return -1;
            }
            return a.Id - b.Id;
        });
    }, [state]);

    useEffect(() => {
        if (state.data == null && !state.loading && !state.error) {
            showLoading();
            getAllFeedbacks().then(() => hideLoading());
        }
    }, [getAllFeedbacks, hideLoading, showLoading, state]);

    useEffect(() => {
        clearError();
    }, [clearError]);

    if (state.data == null) return null;

    if (feedbacks.length === 0) {
        return (
            <main className="text-container border border-gray-200 py-4 shadow-2xl sm:py-6 lg:py-8">
                <p className="text-gray-500">{t("feedback.page.no-feedback")}</p>
            </main>
        );
    }

    return (
        <main className="text-container border border-gray-200 py-4 shadow-2xl sm:py-6 lg:py-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                {t("feedback.page.heading")}
            </h2>
            <ul className="space-y-4">
                {feedbacks.map((fb) => (
                    <li
                        key={fb.Id}
                        className={`flex items-start justify-between border border-gray-200 bg-gray-50 p-3 shadow-sm transition-shadow hover:bg-gray-100 hover:shadow-md ${fb.IsResolved ? "opacity-50" : "opacity-100"}`}
                    >
                        <div>
                            <p className={`text-gray-700 ${fb.IsResolved ? "line-through" : ""}`}>
                                {fb.Text}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                {new Date(fb.Timestamp).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                showLoading();
                                await patchFeedbackResolve(fb.Id, !fb.IsResolved);
                                hideLoading();
                            }}
                            className="ml-4 transform cursor-pointer bg-blue-600 px-3 py-1 text-sm text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] transition hover:bg-blue-700 active:scale-95"
                        >
                            {fb.IsResolved ? t("feedback.page.open") : t("feedback.page.resolve")}
                        </button>
                    </li>
                ))}
            </ul>
        </main>
    );
}

export default Feedback;
