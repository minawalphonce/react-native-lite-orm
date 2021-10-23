import { ExpoAdapter } from '..';
import { IAdapter } from '../adapters/adapter';
import { Row } from '../types';
import { DbSchema } from './db-schema';
import { DbTable } from "./db-table";

export type DbContextOptions = {
  adapter: IAdapter,
  schemaBuilder?: (schema: DbSchema) => Promise<void> | void,
  autoConnect: boolean
}

const defaultDbContextOptions = {
  adapter: new ExpoAdapter(),
  autoConnect: true
} as const;

export class DbContext {

  private _isInitialized = false;
  private _tables = new Map<string, any>();
  private _options: DbContextOptions

  constructor(options?: Partial<DbContextOptions>) {
    this._options = {
      ...defaultDbContextOptions,
      ...options || {}
    }

    if (this._options.autoConnect) {
      this.connect();
    }
  }

  async connect(newName?: string) {
    if (this._options.adapter.name !== newName) {
      this._isInitialized = false;
    }

    if (!this._isInitialized) {
      this._options.adapter.connect(newName);
      if (this._options.schemaBuilder) {
        const schema = new DbSchema(this._options.adapter);
        await this._options.schemaBuilder(schema);
        await this._options.adapter.executeBulkSql(schema._sql, []);
        await Promise.all(schema._actions.map(a => a.execute()));
      }
      this._isInitialized = true;
    }
  }

  table<T extends Row = Row>(name: string) {
    let obj = this._tables.get(name) as DbTable<T>;
    if (!obj) {
      obj = new DbTable<T>(name, this._options.adapter);
      this._tables.set(name, obj);
    }
    return obj;
  }
}
