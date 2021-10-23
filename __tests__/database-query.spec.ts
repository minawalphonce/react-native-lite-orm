import { DbContext } from "../src/core/db-context";
import { IAdapter } from "../src/adapters/adapter";
import { SqlType, Op } from "../src/types";

describe("database queries", () => {

    let mockAdapter: IAdapter = null;
    let database: DbContext = null;

    beforeEach(() => {
        //arrange
        mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(),
            expectSql: jest.fn((sql: string, params: SqlType[]) => Promise.resolve({ rows: [], inserted: 0 })),
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

    // select*
    test("Select everything generate correct TSQL", async () => {
        //act
        await database.table("myTable").query().fetch();

        //assert
        expect(mockAdapter.expectSql).toHaveBeenCalledWith(
            "SELECT * FROM myTable",
            []
        )
    })

    // select special fields 
    test("Select colmns generate correct TSQL", async () => {
        //act
        await database.table("myTable").query({
            columns: ["col1", "col2"]
        }).fetch();

        //assert
        expect(mockAdapter.expectSql).toHaveBeenCalledWith(
            "SELECT col1,col2 FROM myTable",
            []
        )
    })

    // where op single op ..
    test("Select with single cond generate correct TSQL", async () => {
        //act
        await database.table("myTable").query({
            columns: ["col1", "col2"],
            where: [{
                "col1": {
                    [Op.eq]: 1
                }
            }]
        }).fetch();

        //assert
        expect(mockAdapter.expectSql).toHaveBeenCalledWith(
            "SELECT col1,col2 FROM myTable WHERE (col1 = ?)",
            [1]
        )
    })


    test("Select with multiple cond generate correct TSQL", async () => {
        //act
        await database.table("myTable").query({
            columns: ["col1", "col2"],
            where: [{
                "col1": {
                    [Op.lt]: 0,
                    [Op.gt]: 1
                }
            }, {
                "col1": {
                    [Op.isNull]: true
                }
            }]
        }).fetch();

        //assert
        expect(mockAdapter.expectSql).toHaveBeenCalledWith(
            "SELECT col1,col2 FROM myTable WHERE (col1 < ? AND col1 > ?) OR (col1 IS NULL )",
            [0, 1, true]
        )
    })

    // order by
    test("Select with order by generate correct TSQL", async () => {
        //act
        await database.table("myTable").query({
            columns: ["col1", "col2"],
            where: [{
                "col1": {
                    [Op.eq]: 1
                }
            }],
            order: ["col1", "col2 desc"]
        }).fetch();

        //assert
        expect(mockAdapter.expectSql).toHaveBeenCalledWith(
            "SELECT col1,col2 FROM myTable WHERE (col1 = ?) ORDER BY col1,col2 desc",
            [1]
        )
    })

    // paging
    test("Select with paginf by generate correct TSQL", async () => {
        //act
        await database.table("myTable").query({
            columns: ["col1", "col2"],
            where: [{
                "col1": {
                    [Op.eq]: 1
                }
            }],
            order: ["col1", "col2 desc"],
            page: 3,
            limit: 10,
        }).fetch();

        //assert
        expect(mockAdapter.expectSql).toHaveBeenCalledWith(
            "SELECT col1,col2 FROM myTable WHERE (col1 = ?) ORDER BY col1,col2 desc LIMIT 10 OFFSET 20",
            [1]
        )
    })
})