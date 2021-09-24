import { SqlType } from "../types"
export interface IAdapter {
    connect(): void;

    executeBulkSql(sqls: string[], params: SqlType[][]): Promise<Array<any>>;

    expectSql(sql: string, params: SqlType[]): Promise<any>;
}