import { useEffect } from "react";

import { useApiFeedback } from "@/api/data/FeedbackProvider";
import { useLoading } from "@/components/LoadingProvider";

function Feedback() {
    const { state, getAllFeedbacks } = useApiFeedback();
    const { showLoading, hideLoading } = useLoading();

    const feedbacks = state.data;

    useEffect(() => {
        if (state.data == null) {
            showLoading();
            getAllFeedbacks().then(() => hideLoading());
        }
    }, [getAllFeedbacks, hideLoading, showLoading, state.data]);

    if (state.loading !== false) return null;

    if (!feedbacks || feedbacks.length === 0) {
        return (
            <main className="text-container border border-gray-200 py-4 shadow-2xl sm:py-6 lg:py-8">
                <p className="text-gray-500">Kein Feedback verfügbar.</p>
            </main>
        );
    }

    return (
        <main className="text-container border border-gray-200 py-4 shadow-2xl sm:py-6 lg:py-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Feedback</h2>
            <ul className="space-y-4">
                {feedbacks.map((fb) => (
                    <li
                        key={fb.Id}
                        className="border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100"
                    >
                        <p className="text-gray-700">{fb.Text}</p>
                        <p className="mt-1 text-xs text-gray-400">
                            {new Date(fb.Timestamp).toLocaleString()}
                        </p>
                    </li>
                ))}
            </ul>
        </main>
    );
}

export default Feedback;
