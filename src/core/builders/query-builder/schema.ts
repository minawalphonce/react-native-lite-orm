import { ColumnOptions } from "../../../types"

export const customTypes = { JSON: 'TEXT' }

export function _createTableColumn(column: string, options: ColumnOptions) {
    const parts = [column, options.type]
    if (options.primary_key) {
        parts.push('NOT NULL PRIMARY KEY AUTOINCREMENT')
    } else {
        if (options.unique) parts.push('UNIQUE')
        if (options.not_null) parts.push('NOT NULL')
        if (typeof options.default !== "undefined") parts.push(`DEFAULT ${options.default ? options.default.toString() : "NULL"}`)
    }
    return parts.join(' ')
}

/* Creates a string with the columns to create a table like: 
 *  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER
 */
export function _createTableColumns(columns: Record<string, ColumnOptions>) {
    return Object.entries(columns)
        .map(([column, options]) => _createTableColumn(column, options))
        .join(', ')
}

// Creates the "CREATE TABLE" sql statement
export function createTable(tableName: string, columns: Record<string, ColumnOptions>) {
    const columnString = _createTableColumns(columns)
    return `CREATE TABLE IF NOT EXISTS ${tableName} (${columnString});`
}

// Creates the "DROP TABLE" sql statement
export function dropTable(tableName: string) {
    return `DROP TABLE IF EXISTS ${tableName};`
}

export function addColumn(tableName: string, column: string, options: ColumnOptions) {
    return `ALTER TABLE ${tableName} ADD COLUMN ${_createTableColumn(column, options)};`
}

export function dropColumn(tableName: string, column: string) {
    return `ALTER TABLE ${tableName} DROP COLUMN ${column};`
}

export function renameColumn(tableName: string, column: string, newColumn: string) {
    return `ALTER TABLE ${tableName} RENAME COLUMN ${column} TO ${newColumn};`
}

export function tableExists(tableName: string) {
    return `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
}

export default { createTable, dropTable, tableExists, addColumn, dropColumn, renameColumn }