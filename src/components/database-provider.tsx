import React, { ReactNode } from "react";

import { DbContext } from "../core/db-context";
import { ReactDatabaseContext } from "./context";

export interface DatabaseProviderProps {
    dbContext: DbContext
    children: ReactNode
}

function DatabaseProvider({ dbContext, children }: DatabaseProviderProps) {
    return <ReactDatabaseContext.Provider value={dbContext}> {children} </ReactDatabaseContext.Provider>
}

export default DatabaseProvider