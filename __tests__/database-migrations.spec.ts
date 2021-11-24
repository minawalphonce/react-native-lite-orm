import { updateDatabase } from "../src/migrator/update-database";
import { DbContext } from "../src/core/db-context";
import { DbSchema } from "../src/core/db-schema";

describe("database migration", () => {

    const v1 = {
        name: "v1",
        up: async (schema: DbSchema) => {
            schema.createTable("table1", {
                id: {
                    type: "INTEGER",
                    primary_key: true
                },
                col1: {
                    type: "INTEGER",
                },
                col2: {
                    type: "TEXT"
                }
            })
        },
        down: async (schema: DbSchema) => {
            schema.dropTable("table1");
        }
    };

    const v2 = {
        name: "v2",
        up: async (schema: DbSchema) => {
            schema.createTable("table2", {
                id: {
                    type: "INTEGER",
                    primary_key: true
                },
                col1: {
                    type: "INTEGER",
                },
                col2: {
                    type: "TEXT"
                }
            });

            schema.addColumn("tabl1", "col3", {
                type: "BOOLEAN"
            })
        },
        down: async (schema: DbSchema) => {
            schema.dropTable("table2");
        }
    }

    test("no database run all migrations", async () => {

        //arrange 
        const execBulkSql = jest.fn((sqls: string[]) => {
            return Promise.resolve([[]]);
        });

        const ctx = new DbContext({
            schemaBuilder: dbSchema => updateDatabase(dbSchema, [v1, v2]),
            adapter: {
                expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
                executeBulkSql: execBulkSql,
                connect: jest.fn(),
                name: "default"
            },
            autoConnect: false
        });

        //act
        await ctx.connect();

        //assert 
        expect(execBulkSql).toHaveBeenNthCalledWith(1,
            [
                'CREATE TABLE IF NOT EXISTS __migrations (name TEXT, ndx NUMERIC);',
                'CREATE TABLE IF NOT EXISTS table1 (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, col1 INTEGER, col2 TEXT);',
                'CREATE TABLE IF NOT EXISTS table2 (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, col1 INTEGER, col2 TEXT);',
                "ALTER TABLE tabl1 ADD COLUMN col3 BOOLEAN;"
            ], []);

        expect(execBulkSql).toHaveBeenNthCalledWith(2,
            [
                "INSERT OR REPLACE INTO __migrations (name, ndx) VALUES (?, ?);",
                "INSERT OR REPLACE INTO __migrations (name, ndx) VALUES (?, ?);",
            ], [["v1", 0], ["v2", 1]]);
    });

    test("database v1 upgrade to v2 with create table", async () => {
        //arrange 
        const execBulkSql = jest.fn((sqls: string[]) => {
            return Promise.resolve([[]]);
        });

        const ctx = new DbContext({
            schemaBuilder: dbSchema => updateDatabase(dbSchema, [v1, v2]),
            adapter: {
                expectSql: jest.fn(() => Promise.resolve({ rows: [{ name: "v1", ndx: 1 }] })),
                executeBulkSql: execBulkSql,
                connect: jest.fn(),
                name: "default"
            },
            autoConnect: false
        });

        //act
        await ctx.connect();

        //assert 
        expect(execBulkSql).toHaveBeenNthCalledWith(1,
            [
                'CREATE TABLE IF NOT EXISTS table2 (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, col1 INTEGER, col2 TEXT);',
                "ALTER TABLE tabl1 ADD COLUMN col3 BOOLEAN;"
            ], []);

        expect(execBulkSql).toHaveBeenNthCalledWith(2,
            [
                "INSERT OR REPLACE INTO __migrations (name, ndx) VALUES (?, ?);",
            ], [["v2", 1]]);
    });


    // test("database v1 upgrade to v2 with drop table", async () => {

    // });

    // test("database v1 upgrade to v2 with drop column", async () => {

    // });
})