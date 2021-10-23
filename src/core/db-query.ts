import { IAdapter } from "../adapters/adapter";
import { Callback, QueryOptions, Row, SqlType } from "../types";
import qb from "./builders/query-builder";

export class DbQuery<T extends Row = Row> {
    constructor(
        private options: QueryOptions<T> & { tableName: string },
        private adapter: IAdapter
    ) { }
    subscribe(callback: Callback<T>, onErrorCallback?: (err: any) => void) {
        this.fetch().then(callback).catch(onErrorCallback);
        return this;
    }
    unsubscribe() {
        return this;
    }

    async fetch(): Promise<T[]> {
        const sql = qb.query(this.options.tableName, this.options);
        // const params = Object.entries(this.options.where).flatMap(([_, condition]) => Object.values(condition));
        //TODO: enhance this function
        let params: SqlType[] = [];
        if (this.options && this.options.where)
            this.options.where.map((option) => {
                const paramaters = Object.entries(option).flatMap(([_, condition]) =>
                    Object.values(condition)
                );
                //@ts-ignore
                params = [...params, ...paramaters];
            });
        const res = await this.adapter.expectSql(sql, params);
        return res.rows;

    }
}
