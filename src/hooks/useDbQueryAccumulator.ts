import React, { useRef, useReducer, useLayoutEffect, useCallback, useState } from "react";

import { QueryOptions, Row } from "../types";
import { useDbContext } from "./useDbContext";

export function useDbQueryAccumulator<T extends Row>(
    query: QueryOptions<T> & { tableName: string },
    onError: (err: any) => void = () => { },
    deps: React.DependencyList = []
): [T[], () => void] {
    const [, forceRender] = useReducer((s) => s + 1, 0)
    const queryResult = useRef<T[]>([]);
    const dbContext = useDbContext();
    const dbQuery = dbContext.table<T>(query.tableName);

    const loadMore = useCallback(async (page?: number, limit?: number) => {
        try {
            const result = await dbQuery.query({
                ...query,
                page: page || (query.page || 0) + (query.limit || 0),
                limit: limit || query.limit || 10
            }).fetch()
            if (queryResult.current === result)
                return;
            queryResult.current = [
                ...queryResult.current,
                ...result];
            forceRender();
        }
        catch (err) {
            onError(err);
        }
    }, [...deps, dbContext]);

    useLayoutEffect(() => {
        dbQuery.query(query).fetch()
            .then((result) => {
                if (queryResult.current === result)
                    return;
                queryResult.current = [
                    ...queryResult.current,
                    ...result];
                forceRender();
            }).catch(onError);
    }, [...deps, dbContext]);

    return [queryResult.current, loadMore];
}