import qb from './builders/query-builder';
import { IAdapter } from "../adapters/adapter";
import { Row, SqlType } from "../types";

export class DbAction<T extends Row = Row> {
    _sql: string[];
    _params: SqlType[][];
    _rows: T[];

    constructor(private tableName: string, private adapter: IAdapter) {
        this._sql = [];
        this._params = [];
        this._rows = [];
    }

    add(...rows: T[]) {
        rows.forEach((row) => {
            this._sql.push(qb.insertOrReplace(this.tableName, row));
            this._params.push(Object.values(row));
            this._rows.push(row);
        });
        return this;
    }

    update(...rows: T[]) {
        rows.forEach((row) => {
            const { id, ...rest } = row;
            this._sql.push(qb.update(this.tableName, row));
            this._params.push([...Object.values(rest), id]);
            this._rows.push(row);
        });
        return this;
    }

    destroy(...rows: T[]) {
        if (rows.length)
            rows.forEach((row) => {
                this._sql.push(qb.destroy(this.tableName));
                this._params.push([row.id]);
                this._rows.push(row);
            });
        else {
            this._sql.push(qb.destroyAll(this.tableName));
            this._params.push([]);
            this._rows.push({} as any);
        }
        return this;
    }

    async execute() {
        return await this.adapter.executeBulkSql(this._sql, this._params);
    }
}