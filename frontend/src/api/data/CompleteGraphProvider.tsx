import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from "react";
import { useApi } from "@/api/ApiProvider.tsx";
import type { ApiData, ContextAction } from "@/types/types.ts";
import type { CompleteGraph } from "@/types/dto.ts";

enum CompleteGraphActions {
    FETCH_START = "FETCH_START",
    FETCH_SUCCESS = "FETCH_SUCCESS",
    FETCH_ERROR = "FETCH_ERROR",
}

function completeGraphReducer(
    state: ApiData<CompleteGraph>,
    action: ContextAction<CompleteGraph, CompleteGraphActions>,
): ApiData<CompleteGraph> {
    switch (action.type) {
        case CompleteGraphActions.FETCH_START:
            return { ...state, loading: true };
        case CompleteGraphActions.FETCH_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload,
                error: undefined,
            };
        case CompleteGraphActions.FETCH_ERROR:
            return {
                ...state,
                loading: false,
                error: action.error,
                data: undefined,
            };
        default:
            return state;
    }
}

const initialState: ApiData<CompleteGraph> = {
    data: undefined,
    loading: undefined,
    error: undefined,
};

const CompleteGraphContext = createContext({
    state: initialState,
    getCompleteGraph: () => Promise.resolve(),
});

export function CompleteGraphProvider({ children }: PropsWithChildren) {
    const [state, dispatch] = useReducer(completeGraphReducer, initialState);
    const api = useApi();

    const getCompleteGraph = useCallback(async () => {
        dispatch({ type: CompleteGraphActions.FETCH_START });
        try {
            const data = await api
                .get("/graph/complete")
                .then((res) => res.data);
            dispatch({
                type: CompleteGraphActions.FETCH_SUCCESS,
                payload: data,
            });
        } catch (err) {
            dispatch({ type: CompleteGraphActions.FETCH_ERROR, error: err });
        }
    }, [dispatch]);

    const value = useMemo(
        () => ({ state, getCompleteGraph: getCompleteGraph }),
        [state],
    );

    return (
        <CompleteGraphContext.Provider value={value}>
            {children}
        </CompleteGraphContext.Provider>
    );
}

export function useApiCompleteGraph() {
    return useContext(CompleteGraphContext);
}
