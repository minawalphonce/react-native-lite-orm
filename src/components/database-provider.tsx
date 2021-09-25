import React, { ReactNode } from "react";

import { DbContext } from "../core/db-context";
import { ReactDatabaseContext } from "./context";

export interface DatabaseProviderProps {
    database: DbContext
    children: ReactNode
}

export function DatabaseProvider({ database, children }: DatabaseProviderProps) {
    return <ReactDatabaseContext.Provider value={database}>{children}</ReactDatabaseContext.Provider>
}