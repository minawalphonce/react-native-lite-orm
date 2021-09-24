import { useRef, useReducer } from "react";
import { DbAction } from "../core/db-context";

import { Row } from "../types";
import { useDbContext } from "./useDbContext";

export function useDbAction<T extends Row>({ tableName }: { tableName: string }): DbAction<T> {
    return useDbContext().table<T>(tableName).actions();
}