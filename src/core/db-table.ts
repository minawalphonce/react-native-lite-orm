import { IAdapter } from "../adapters/adapter";
import { Callback, QueryOptions, Row } from "../types";
import fb, { Operation } from "./builders/filter-builder";
import { DbAction } from "./db-action";
import { DbQuery } from "./db-query";

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
                        return (callback: Callback<T>) => {
                            this.subscrtiptions.set(target, {
                                filter: !(options?.where) ? () => true : fb.toFilterExpression(options.where),
                                callback: callback,
                            });
                            target.subscribe(callback);
                        };
                    } else if (methodName === 'unsubscribe') {
                        return () => {
                            this.subscrtiptions.delete(target);
                            target.unsubscribe();
                        };
                    }
                    return target[methodName];
                },
            }
        );
    }
}