import { IAdapter } from '../adapters/adapter';
import qb from './builders/query-builder';
import fb, { Operation } from './builders/filter-builder';
import { Callback, Row, QueryOptions, SqlType, ColumnOptions } from '../types';

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

export class DbQuery<T extends Row = Row> {
  constructor(
    private options: QueryOptions<T> & { tableName: string },
    private adapter: IAdapter
  ) { }
  async subscribe(callback: Callback<T>) {
    const res = await this.fetch();
    await callback(res);
    return this;
  }
  async unsubscribe() {
    return this;
  }

  async fetch(): Promise<T[]> {
    const sql = qb.query(this.options.tableName, this.options);
    // const params = Object.entries(this.options.where).flatMap(([_, condition]) => Object.values(condition));
    //TODO: enhance this function
    let params = [];
    if (this.options && this.options.where)
      this.options.where.map((option) => {
        const paramaters = Object.entries(option).flatMap(([_, condition]) =>
          Object.values(condition)
        );
        params = [...params, ...paramaters];
      });
    const res = await this.adapter.expectSql(sql, params);
    return res.rows;

  }
}

export class DbAction<T extends Row = Row> {
  _sql: string[];
  _params: SqlType[][];
  _rows: Partial<T>[];

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

  update(...rows: Partial<T>[]) {
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

export class DbTable<T extends Row = Row> {
  constructor(private tableName: string, private adapter: IAdapter) { }

  private subscrtiptions = new Map<
    DbQuery<T>,
    {
      filter: Operation;
      callback: Callback<T>;
    }
  >();

  actions(): DbAction<T> {
    return new Proxy(new DbAction<T>(this.tableName, this.adapter), {
      get: (target, methodName) => {
        if (methodName === 'execute') {
          return async () => {
            const affectedRows = target._rows;
            const callbacks: {
              query: DbQuery<T>;
              callback: Callback<T>;
            }[] = [];
            for (const [dbQuery, sub] of this.subscrtiptions.entries()) {
              if (affectedRows.filter(sub.filter).length > 0) {
                callbacks.push({ query: dbQuery, callback: sub.callback });
              }
            }
            await target.execute();
            // console.log('callbacks affected', callbacks.length);
            //try catch
            //timeout
            // for (const cbk of callbacks) {
            //   const res = await cbk.query.fetch();
            //   // console.log('cbk.query.fetch', res.length);

            //   await cbk.callback(res);
            // }
            callbacks.forEach(async (cbk) => {
              const res = await cbk.query.fetch();
              await cbk.callback(res);
            });
          };
        }
        return target[methodName];
      },
    });
  }
  query(options?: QueryOptions<T>): DbQuery<T> {
    return new Proxy(
      new DbQuery<T>({ ...options, tableName: this.tableName }, this.adapter),
      {
        get: (target, methodName) => {
          if (methodName === 'subscribe') {
            return async (callback: Callback<T>) => {
              this.subscrtiptions.set(target, {
                filter: !(options?.where) ? () => true : fb.toFilterExpression(options.where),
                callback: callback,
              });
              await target.subscribe(callback);
            };
          } else if (methodName === 'unsubscribe') {
            return async () => {
              this.subscrtiptions.delete(target);
              await target.unsubscribe();
            };
          }
          return target[methodName];
        },
      }
    );
  }
}

export class DbContext {
  private static _isInitialized = false;
  private _tables = new Map<string, DbTable>();
  constructor(
    private adapter: IAdapter,
    private schemaBuilder?: (schema: DbSchema) => Promise<void> | void
  ) {
    (async () => {
      if (!DbContext._isInitialized) {
        adapter.connect();
        if (schemaBuilder) {
          const schema = new DbSchema(adapter);
          await this.schemaBuilder(schema);
          await this.adapter.executeBulkSql(schema._sql, []);
          await Promise.all(schema._actions.map(a => a.execute()));
        }
      }
    })();
  }

  table<T extends Row = Row>(name: string) {
    let obj = this._tables.get(name) as DbTable<T>;
    if (!obj) {
      obj = new DbTable<T>(name, this.adapter);
      this._tables.set(name, obj);
    }
    return obj;
  }
}
