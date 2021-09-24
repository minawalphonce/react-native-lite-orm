import React from 'react'
import { DbContext } from '../core/db-context';

export const ReactDatabaseContext =
  /*#__PURE__*/ React.createContext<DbContext | null>(null)

if (process.env.NODE_ENV !== 'production') {
  ReactDatabaseContext.displayName = 'ReactDatabase'
}

export default ReactDatabaseContext;