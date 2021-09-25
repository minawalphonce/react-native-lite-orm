import { useRef, useReducer, useLayoutEffect, useCallback } from "react";

import { QueryOptions, Row } from "../types";
import { useDbContext } from "./useDbContext";

export function useDbQuery<T extends Row>(query: QueryOptions<T> & { tableName: string }): T[] {
    const [, forceRender] = useReducer((s) => s + 1, 0)
    const queryResult = useRef<T[]>([]);
    const dbContext = useDbContext();

    const callBack = useCallback((result: T[]) => {
        console.log(result);
        if (queryResult.current === result)
            return;
        queryResult.current = result;
        forceRender();
    }, [dbContext]);

    useLayoutEffect(() => {
        const unsubscribe = dbContext.table<T>(query.tableName).query(query).subscribe(callBack).subscribe;
        return () => {
            unsubscribe(callBack)
        }
    }, [dbContext]);

    return queryResult.current;
}