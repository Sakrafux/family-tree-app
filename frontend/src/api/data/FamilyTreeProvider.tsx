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
import type { FamilyTreeDto } from "@/types/dto.ts";

enum FamilyTreeActions {
    FETCH_START = "FETCH_START",
    FETCH_SUCCESS = "FETCH_SUCCESS",
    FETCH_ERROR = "FETCH_ERROR",
}

function familyTreeReducer(
    state: ApiData<FamilyTreeDto>,
    action: ContextAction<FamilyTreeDto, FamilyTreeActions>,
): ApiData<FamilyTreeDto> {
    switch (action.type) {
        case FamilyTreeActions.FETCH_START:
            return { ...state, loading: true };
        case FamilyTreeActions.FETCH_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload,
                error: undefined,
            };
        case FamilyTreeActions.FETCH_ERROR:
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

// TODO extend to cache multiple family trees with different roots
const initialState: ApiData<FamilyTreeDto> = {
    data: undefined,
    loading: undefined,
    error: undefined,
};

const FamilyTreeContext = createContext({
    state: initialState,
    // @ts-expect-error TS6133
    getFamilyTree: (id: string, distance?: number) => Promise.resolve(),
});

export function FamilyTreeProvider({ children }: PropsWithChildren) {
    const [state, dispatch] = useReducer(familyTreeReducer, initialState);
    const api = useApi();

    const getFamilyTree = useCallback(
        async (id: string, distance?: number) => {
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
        [dispatch],
    );

    const value = useMemo(
        () => ({ state, getFamilyTree: getFamilyTree }),
        [state],
    );

    return (
        <FamilyTreeContext.Provider value={value}>
            {children}
        </FamilyTreeContext.Provider>
    );
}

export function useApiFamilyTree() {
    return useContext(FamilyTreeContext);
}
