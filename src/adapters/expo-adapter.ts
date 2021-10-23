import { WebSQLDatabase, openDatabase } from 'expo-sqlite';

import { IAdapter } from "./adapter";

export class ExpoAdapter implements IAdapter {
    private database: WebSQLDatabase | null;

    constructor(public name = "default") {
        this.database = null;
    }

    connect(newName?: string) {
        this.name = newName || this.name;
        this.database = openDatabase(this.name);
    }

    async executeBulkSql(sqls: string[], params: any[] = []): Promise<Array<{ rows?: any[], insertId?: number }>> {

        return new Promise((txResolve, txReject) => {
            if (!this.database) {
                this.connect();
            }
            else
                this.database.transaction(
                    tx => {
                        Promise.all(sqls.map((sql, index) => {
                            return new Promise<{ rows: any[], insertedId: number }>((sqlResolve, sqlReject) => {
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
        });
    }

    async expectSql(sql: string, params: any[] = []): Promise<{ rows?: any[], insertId?: number }> {
        return this.executeBulkSql([sql], [params])
            .then(res => res[0])
            .catch(error => { throw error })
    }
}
