import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from "react";

import { useApi } from "@/api/ApiProvider";
import type { ApiData, ContextAction, FamilyTreeDto } from "@/types";

enum FamilyTreeActions {
    FETCH_START = "FETCH_START",
    FETCH_SUCCESS = "FETCH_SUCCESS",
    FETCH_ERROR = "FETCH_ERROR",
}

function familyTreeReducer(
    state: ApiData<Record<string, FamilyTreeDto>>,
    action: ContextAction<FamilyTreeDto, FamilyTreeActions>,
): ApiData<Record<string, FamilyTreeDto>> {
    switch (action.type) {
        case FamilyTreeActions.FETCH_START:
            return { ...state, loading: true };
        case FamilyTreeActions.FETCH_SUCCESS:
            return {
                ...state,
                loading: false,
                // Append the family tree to the cached data
                data: { ...(state.data ?? {}), [action.payload!.Root.Id]: action.payload! },
                error: undefined,
            };
        case FamilyTreeActions.FETCH_ERROR:
            return {
                ...state,
                loading: false,
                error: action.error,
            };
        default:
            return state;
    }
}

type FamilyTreeContextType = {
    // Cache all queried family trees in a map by their id
    state: ApiData<Record<string, FamilyTreeDto>>;
    getFamilyTree: (id: string, distance?: number) => Promise<void>;
};

const FamilyTreeContext = createContext<FamilyTreeContextType | undefined>(undefined);

const initialState: ApiData<Record<string, FamilyTreeDto>> = {
    data: undefined,
    loading: undefined,
    error: undefined,
};

export function FamilyTreeProvider({ children }: PropsWithChildren) {
    const [state, dispatch] = useReducer(familyTreeReducer, initialState);
    const api = useApi();

    const getFamilyTree = useCallback(
        async (id: string, distance?: number) => {
            // Don't fetch cached data again
            if (state.data?.[id] != null) {
                return;
            }
            dispatch({ type: FamilyTreeActions.FETCH_START });
            try {
                const data = await api
                    .get(`/family-tree/${id}`, { params: { distance } })
                    .then((res) => res.data);
                dispatch({
                    type: FamilyTreeActions.FETCH_SUCCESS,
                    payload: data,
                });
            } catch (err) {
                dispatch({ type: FamilyTreeActions.FETCH_ERROR, error: err });
            }
        },
        [api, state.data],
    );

    const value = useMemo(() => ({ state, getFamilyTree: getFamilyTree }), [getFamilyTree, state]);

    return <FamilyTreeContext.Provider value={value}>{children}</FamilyTreeContext.Provider>;
}

export function useApiFamilyTree() {
    const context = useContext(FamilyTreeContext);
    if (!context) {
        throw new Error("useApiFamilyTree must be used within a FamilyTreeProvider");
    }
    return context;
}
