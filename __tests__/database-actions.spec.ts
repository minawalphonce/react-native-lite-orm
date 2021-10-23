import { DbAction } from "../src/core/db-action";
import { DbContext } from "../src/core/db-context";
import { IAdapter } from "../src/adapters/adapter";

describe("database actions", () => {
    let mockAdapter: IAdapter = null;
    let database: DbContext = null;

    beforeEach(() => {
        //arrange
        mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(),
            expectSql: jest.fn(),
            name: "default"
        };
        database = new DbContext({
            adapter: mockAdapter
        });
    })

    afterEach(() => {
        database = null;
        mockAdapter = null;
    })

    test("single add generate correct TSQL", async () => {
        //act 
        await database.table("new-table").actions().add({
            id: 1,
            name: "test"
        }).execute();

        //assert
        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith([
                "INSERT OR REPLACE INTO new-table (id, name) VALUES (?, ?);"
            ], [[1, "test"]]);

    })

    test("multiple adds generate correct TSQL", async () => {
        //act 
        await database.table("new-table").actions().add(
            {
                id: 1,
                name: "test1"
            },
            {
                id: 2,
                name: "test2"
            },
            {
                id: 3,
                name: "test3"
            },
        ).execute();

        //assert 
        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith([
                "INSERT OR REPLACE INTO new-table (id, name) VALUES (?, ?);",
                "INSERT OR REPLACE INTO new-table (id, name) VALUES (?, ?);",
                "INSERT OR REPLACE INTO new-table (id, name) VALUES (?, ?);"
            ], [[1, "test1"], [2, "test2"], [3, "test3"]]);
    })

    test("single update generate correct TSQL", async () => {
        await database.table("old-table").actions()
            .update({
                id: 1,
                name: "test"
            }).execute();

        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith([
                "UPDATE old-table SET name = ? WHERE id = ?;"
            ], [["test", 1]]);
    })

    test("multiple updates generate correct TSQL", async () => {
        await database.table("old-table").actions()
            .update(
                {
                    id: 1,
                    name: "test1"
                },
                {
                    id: 2,
                    name: "test2"
                },
                {
                    id: 3,
                    name: "test3"
                }).execute();

        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith([
                "UPDATE old-table SET name = ? WHERE id = ?;",
                "UPDATE old-table SET name = ? WHERE id = ?;",
                "UPDATE old-table SET name = ? WHERE id = ?;"
            ], [["test1", 1], ["test2", 2], ["test3", 3]]);
    })

    test("single destroy generate correct TSQL", async () => {
        //act 
        await database.table("old-table").actions()
            .destroy({
                id: 1,
                name: "test"
            }).execute();

        //assert 
        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith([
                "DELETE FROM old-table WHERE id = ?;"
            ], [[1]]);
    })

    test("destroy all generate correct TSQL", async () => {
        //act 
        await database.table("old-table").actions()
            .destroy().execute();

        //assert 
        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith([
                "DELETE FROM old-table;"
            ], [[]]);
    })

    test("combine operations generate correct TSQL", async () => {
        //arrange 
        const operations = [
            {
                name: "add",
                op: (action: DbAction) => {
                    action.add({
                        id: 1,
                        name: "test"
                    });
                },
                result: [
                    "INSERT OR REPLACE INTO mytable (id, name) VALUES (?, ?);",
                    [1, "test"]
                ]
            },
            {
                name: "update",
                op: (action: DbAction) => {
                    action.update({
                        id: 1,
                        name: "test"
                    })
                },
                result: [
                    "UPDATE mytable SET name = ? WHERE id = ?;",
                    ["test", 1]
                ]
            },
            {
                name: "destroy",
                op: (action: DbAction) => {
                    action.destroy({
                        id: 1,
                        name: "test"
                    })
                },
                result: [
                    "DELETE FROM mytable WHERE id = ?;",
                    [1]
                ]
            }
        ]

        //act
        const actions = database.table("mytable").actions();
        const tsql = [];
        const params = [];

        let i = getRandomInt(10);
        while (i >= 0) {
            i--;
            const opIndex = getRandomInt(3);
            const operation = operations[opIndex];

            operation.op(actions);
            tsql.push(operation.result[0]);
            params.push(operation.result[1]);
        }

        await actions.execute();
        // assert 
        expect(mockAdapter.executeBulkSql)
            .toHaveBeenCalledWith(
                tsql, params
            );
    })
});

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}