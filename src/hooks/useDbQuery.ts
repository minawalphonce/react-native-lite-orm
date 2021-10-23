import React, { useRef, useReducer, useLayoutEffect, useCallback } from "react";

import { QueryOptions, Row } from "../types";
import { useDbContext } from "./useDbContext";

export function useDbQuery<T extends Row>(
    query: QueryOptions<T> & { tableName: string },
    onError: (err: any) => void = () => { },
    deps: React.DependencyList = []
): T[] {
    const [, forceRender] = useReducer((s) => s + 1, 0)
    const queryResult = useRef<T[]>([]);
    const dbContext = useDbContext();

    const callBack = useCallback((result: T[]) => {
        if (queryResult.current === result)
            return;
        queryResult.current = result;
        forceRender();
    }, [...deps, dbContext]);

    useLayoutEffect(() => {
        const dbQuery = dbContext.table<T>(query.tableName).query(query);
        dbQuery.subscribe(callBack);
        return () => {
            dbQuery.unsubscribe();
        }
    }, [...deps, dbContext]);

    return queryResult.current;
}