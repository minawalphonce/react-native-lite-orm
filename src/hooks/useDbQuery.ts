import { useRef, useReducer, useLayoutEffect } from "react";

import { QueryOptions } from "../types";
import { useDbContext } from "./useDbContext";

export function useDbQuery<T>(query: QueryOptions & { tableName: string }): T[] {
    const [, forceRender] = useReducer((s) => s + 1, 0)
    const queryResult = useRef<T[]>([]);
    const dbContext = useDbContext();

    useLayoutEffect(() => {
        dbContext.table(query.tableName).query(query).subscribe(result => {
            if (queryResult.current === result)
                return;
            queryResult.current = result;
            forceRender();
        })
    });
    return queryResult.current;
}