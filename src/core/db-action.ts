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
            this._sql.push(qb.insert(this.tableName, row));
            this._params.push(Object.values(row));
            this._rows.push(row);
        });
        return this;
    }

    update(...rows: T[]) {
        rows.forEach((row) => {
            this._sql.push(qb.update(this.tableName, row));
            this._params.push(Object.values(row));
            this._rows.push(row);
        });
        return this;
    }

    destroy(...rows: T[]) {
        rows.forEach((row) => {
            this._sql.push(qb.destroy(this.tableName));
            this._params.push([row.id]);
            this._rows.push(row);
        });
        return this;
    }

    async execute() {
        return await this.adapter.executeBulkSql(this._sql, this._params);
    }
}