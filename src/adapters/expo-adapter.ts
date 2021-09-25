import * as SQLite from 'expo-sqlite';

import { IAdapter } from "./adapter";

export class ExpoAdapter implements IAdapter {
    private database: SQLite.WebSQLDatabase

    constructor(public name = "trooprDb") {

    }

    connect() {
        this.database = SQLite.openDatabase(this.name);
    }

    async executeBulkSql(sqls: string[], params: any[] = []): Promise<Array<{ rows?: any[], insertId?: number }>> {
        return new Promise((txResolve, txReject) => {
            this.database.transaction(
                tx => {
                    Promise.all(sqls.map((sql, index) => {
                        return new Promise((sqlResolve, sqlReject) => {
                            tx.executeSql(
                                sql,
                                params[index],
                                (_, { rows, insertId }) => {
                                    //@ts-ignore
                                    sqlResolve({ rows: rows._array, insertId })
                                },
                                (_, error) => {
                                    sqlReject(error)
                                    return true;
                                }
                            )
                        })
                    }))
                        .then(txResolve)
                        .catch(txReject)
                })
        })
    }

    async expectSql(sql: string, params = []): Promise<{ rows?: any[], insertId?: number }> {
        return this.executeBulkSql([sql], [params])
            .then(res => res[0])
            .catch(error => { throw error })
    }
}
