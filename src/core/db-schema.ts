import { IAdapter } from "../adapters/adapter";
import { ColumnOptions, QueryOptions, Row } from "../types";
import { DbAction } from "./db-action";
import qb from "./builders/query-builder";
import { DbQuery } from "./db-query";

export class DbSchema {
    _sql: string[];
    _actions: DbAction[];
    constructor(private adapter: IAdapter) {
        this._sql = [];
        this._actions = [];
    }

    createTable(tableName: string, columns: Record<string, ColumnOptions>) {
        this._sql.push(qb.createTable(tableName, columns));
    }

    dropTable(tableName: string) {
        this._sql.push(qb.dropTable(tableName));
    }

    addColumn(tableName: string, column: string, option: ColumnOptions) {
        this._sql.push(qb.addColumn(tableName, column, option));
    }

    dropColumn(tableName: string, column: string) {
        this._sql.push(qb.dropColumn(tableName, column));
    }

    renameColumn(tableName: string, column: string, newColumn: string) {
        this._sql.push(qb.renameColumn(tableName, column, newColumn));
    }

    async tableExists(tableName: string): Promise<Boolean> {
        const res = await this.adapter.expectSql(qb.tableExists(tableName), []);
        return res.rows.length > 0;
    }

    action<T extends Row = Row>(tableName: string) {
        const action = new DbAction<T>(tableName, this.adapter);
        this._actions.push(action);
        return action;
    }

    query<T extends Row = Row>(tableName: string, options?: QueryOptions<T>): Omit<DbQuery<T>, "subscribe" | "unsubscribe"> {
        return new DbQuery<T>({ tableName, ...options }, this.adapter);
    }

}