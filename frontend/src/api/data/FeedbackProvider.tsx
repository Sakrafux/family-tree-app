import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from "react";

import { useApi } from "@/api/ApiProvider";
import { useToast } from "@/components/Toast/ToastProvider";
import type { FeedbackDto } from "@/types/dto";
import type { ApiData, ContextAction } from "@/types/types";

enum FeedbackActions {
    GET_START = "GET_START",
    GET_SUCCESS = "GET_SUCCESS",
    POST_SUCCESS = "POST_SUCCESS",
    PATCH_SUCCESS = "PATCH_SUCCESS",
    QUERY_ERROR = "QUERY_ERROR",
}

function feedbackReducer(
    state: ApiData<Record<number, FeedbackDto>>,
    action: ContextAction<Record<number, FeedbackDto> | FeedbackDto, FeedbackActions>,
): ApiData<Record<number, FeedbackDto>> {
    switch (action.type) {
        case FeedbackActions.GET_START:
            return { ...state, loading: true };
        case FeedbackActions.GET_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload as Record<number, FeedbackDto>,
                error: undefined,
            };
        case FeedbackActions.POST_SUCCESS: {
            if (state.data == null) {
                return state;
            }
            const data = action.payload as FeedbackDto;
            return {
                ...state,
                data: { ...state.data, [data.Id]: data },
                error: undefined,
            };
        }
        case FeedbackActions.PATCH_SUCCESS: {
            if (state.data == null) {
                return state;
            }
            const { id, isResolved } = action.params!;
            const data = state.data[id];
            return {
                ...state,
                data: { ...state.data, [id]: { ...data, IsResolved: isResolved } },
                error: undefined,
            };
        }
        case FeedbackActions.QUERY_ERROR:
            return {
                ...state,
                error: action.error,
            };
        default:
            return state;
    }
}

type FeedbackContextType = {
    state: ApiData<Record<number, FeedbackDto>>;
    getAllFeedbacks: () => Promise<void>;
    postFeedback: (text: string) => Promise<void>;
    patchFeedbackResolve: (id: number, isResolved: boolean) => Promise<void>;
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const initialState: ApiData<Record<number, FeedbackDto>> = {
    data: undefined,
    loading: undefined,
    error: undefined,
};

export function FeedbackProvider({ children }: PropsWithChildren) {
    const [state, dispatch] = useReducer(feedbackReducer, initialState);
    const api = useApi();
    const { showToast } = useToast();

    const getAllFeedbacks = useCallback(async () => {
        dispatch({ type: FeedbackActions.GET_START });
        try {
            const data = await api.get<FeedbackDto[]>("/feedbacks").then((res) => res.data);
            dispatch({
                type: FeedbackActions.GET_SUCCESS,
                payload: Object.fromEntries(data.map((f) => [f.Id, f])),
            });
        } catch (err) {
            dispatch({ type: FeedbackActions.QUERY_ERROR, error: err });
            showToast("error", "Feedback-Daten konnten nicht abgefragt werden");
        }
    }, [api, showToast]);

    const postFeedback = useCallback(
        async (text: string) => {
            try {
                const data = await api.post("/feedbacks", { Text: text }).then((res) => res.data);
                dispatch({
                    type: FeedbackActions.POST_SUCCESS,
                    payload: data,
                });
                showToast("success", "Feedback wurde erfolgreich gesendet", 5000);
            } catch (err) {
                dispatch({ type: FeedbackActions.QUERY_ERROR, error: err });
                showToast("error", "Feedback konnte nicht gesendet werden");
            }
        },
        [api, showToast],
    );

    const patchFeedbackResolve = useCallback(
        async (id: number, isResolved: boolean) => {
            try {
                await api
                    .patch(`/feedbacks/${id}`, { IsResolved: isResolved })
                    .then((res) => res.data);
                dispatch({
                    type: FeedbackActions.PATCH_SUCCESS,
                    params: { id, isResolved },
                });
            } catch (err) {
                dispatch({ type: FeedbackActions.QUERY_ERROR, error: err });
                showToast("error", "Feedback konnte nicht geupdated werden");
            }
        },
        [api, showToast],
    );

    const value = useMemo(
        () => ({ state, getAllFeedbacks, postFeedback, patchFeedbackResolve }),
        [getAllFeedbacks, patchFeedbackResolve, postFeedback, state],
    );

    return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useApiFeedback() {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useApiFeedback must be used within a FeedbackProvider");
    }
    return context;
}
