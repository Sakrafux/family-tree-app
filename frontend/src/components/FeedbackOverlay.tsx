import { useState } from "react";

import { useApiFeedback } from "@/api/data/FeedbackProvider";
import { useLoading } from "@/components/Loading";

function FeedbackOverlay() {
    const [feedback, setFeedback] = useState("");

    const { postFeedback } = useApiFeedback();
    const { showLoading, hideLoading } = useLoading();

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            setFeedback("");
            return;
        }
        showLoading();
        await postFeedback(feedback);
        hideLoading();
        setFeedback("");
    };

    return (
        <div className="fixed right-5 bottom-5 z-50 w-96 rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
            <h2 className="mb-3 cursor-default text-xl font-semibold">Feedback</h2>
            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback hier..."
                className="mb-4 h-32 w-full resize-none rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <button
                onClick={handleSubmit}
                className="w-full transform cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition duration-150 hover:bg-blue-700 active:scale-95 active:bg-blue-800"
            >
                Senden
            </button>
        </div>
    );
}

export default FeedbackOverlay;
