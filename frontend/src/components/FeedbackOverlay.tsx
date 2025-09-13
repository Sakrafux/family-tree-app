import { useState } from "react";

import { useApiFeedback } from "@/api/data/FeedbackProvider";
import { useLoading } from "@/components/LoadingProvider";

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
        <div className="fixed bottom-5 left-5 z-50 hidden w-96 border border-gray-200 bg-white p-5 opacity-40 shadow-[0_0_20px_rgba(0,0,0,0.2)] focus-within:opacity-100 md:block">
            <h2 className="mb-3 cursor-default text-xl font-semibold">Feedback</h2>
            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback hier..."
                className="mb-4 h-32 w-full resize-none border border-gray-300 p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <button
                onClick={handleSubmit}
                className="w-full transform cursor-pointer bg-blue-600 py-3 font-bold text-white transition duration-150 hover:bg-blue-700 active:scale-95 active:bg-blue-800"
            >
                Senden
            </button>
        </div>
    );
}

export default FeedbackOverlay;
