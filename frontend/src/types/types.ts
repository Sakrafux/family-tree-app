export type ApiData<T> = {
    data?: T;
    loading?: boolean;
    error?: Error;
};

export type ContextAction<P, T = string, E = any> = {
    type: T;
    payload?: P;
    error?: E;
};
