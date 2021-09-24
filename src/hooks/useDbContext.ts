import { useContext } from "react";

import { DbContext } from "../core/db-context";
import { ReactDatabaseContext } from "../components/context";

export function useDbContext(): DbContext {
    return useContext(ReactDatabaseContext) as DbContext;
}