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
    getFamilyTree: () => Promise.resolve(),
});

export function FamilyTreeProvider({ children }: PropsWithChildren) {
    const [state, dispatch] = useReducer(familyTreeReducer, initialState);
    const api = useApi();

    //TODO extend with id parameter
    const getFamilyTree = useCallback(async () => {
        dispatch({ type: FamilyTreeActions.FETCH_START });
        try {
            const data = await api
                .get(
                    // "/family-tree/01992bc2-416b-73d9-abe5-6b28c928dc85?distance=10",
                    "/family-tree/01992bc2-416b-73d9-abe5-830fc8b141d8?distance=10",
                )
                .then((res) => res.data);
            dispatch({
                type: FamilyTreeActions.FETCH_SUCCESS,
                payload: data,
            });
        } catch (err) {
            dispatch({ type: FamilyTreeActions.FETCH_ERROR, error: err });
        }
    }, [dispatch]);

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
