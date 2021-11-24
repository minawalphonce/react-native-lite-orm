import { DbContext } from "../src/core/db-context";
import { Op } from "../src/types";

const sleep = (seconds: number) => new Promise(r => setTimeout(r, seconds * 1000));

describe("database queries", () => {

    test("subscription without query, callback in next tick", async () => {
        //arrange 
        const mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(() => Promise.resolve([])),
            expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
            name: "mock"
        }
        const ctx = new DbContext({
            adapter: mockAdapter
        });
        const subscriptionFunc = jest.fn();
        //act 
        ctx.table("myTable").query().subscribe(subscriptionFunc);
        //assert 
        await sleep(0.1);
        expect(subscriptionFunc).toBeCalledTimes(1);
    })

    test("subscription with query, callback in next tick", async () => {
        //arrange 
        const mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(() => Promise.resolve([])),
            expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
            name: "mock"
        }
        const ctx = new DbContext({
            adapter: mockAdapter
        });
        const subscriptionFunc = jest.fn();
        //act 
        ctx.table("myTable").query({
            columns: "*",
            "where": [{
                "col1": {
                    [Op.eq]: "val1"
                }
            }]
        }).subscribe(subscriptionFunc);
        //assert 
        await sleep(0.1);
        expect(subscriptionFunc).toBeCalledTimes(1);
    })

    test("subscription with And query, callback after add", async () => {
        //arrange 
        const mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(() => Promise.resolve([])),
            expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
            name: "mock"
        }
        const ctx = new DbContext({
            adapter: mockAdapter
        });
        const subscriptionFunc = jest.fn();

        //act 
        const myTable = ctx.table("myTable");
        myTable.query({
            columns: "*",
            where: [{
                "col1": {
                    [Op.eq]: "val1"
                },
                "col2": {
                    [Op.gt]: 0,
                    [Op.lt]: 10
                },
                "col3": {
                    [Op.isNull]: true
                },
                "col4": {
                    [Op.isNotNull]: true
                },
                "col5": {
                    [Op.neq]: 0
                },
                "col6": {
                    [Op.cont]: "%x%"
                },
                "col7": {
                    [Op.gteq]: 0,
                    [Op.lteq]: 10,
                }
            }]
        }).subscribe(subscriptionFunc);

        await myTable.actions().add({
            "id": 1,
            "col1": "val1",
            "col2": 5,
            "col3": null,
            "col4": "1",
            "col5": 1,
            "col6": "xyz",
            "col7": 5
        }).execute();


        //assert 
        await sleep(0.1);
        expect(subscriptionFunc).toBeCalledTimes(2);
    });

    test("subscription with Or query, callback after add", async () => {
        //arrange 
        const mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(() => Promise.resolve([])),
            expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
            name: "mock"
        }
        const ctx = new DbContext({
            adapter: mockAdapter
        });
        const subscriptionFunc = jest.fn();

        //act 
        const myTable = ctx.table("myTable");
        myTable.query({
            columns: "*",
            where: [
                {
                    "col1": {
                        [Op.eq]: "val1"
                    }
                },
                {
                    "col2": {
                        [Op.gt]: 0,
                        [Op.lt]: 10
                    }
                }, {
                    "col3": {
                        [Op.isNull]: true
                    }
                }, {
                    "col4": {
                        [Op.isNotNull]: true
                    }
                }, {
                    "col5": {
                        [Op.neq]: 0
                    }
                }, {
                    "col6": {
                        [Op.cont]: "%x%"
                    }
                }, {
                    "col7": {
                        [Op.gteq]: 0,
                        [Op.lteq]: 10,
                    }
                }]
        }).subscribe(subscriptionFunc);

        await myTable.actions().add({
            "id": 1,
            "col1": "val2",
            "col2": 11,
            "col3": "dadas",
            "col4": null,
            "col5": 0,
            "col6": "abc",
            "col7": 5
        }).execute();


        //assert 
        await sleep(0.1);
        expect(subscriptionFunc).toBeCalledTimes(2);
    });

    test("subscription, unsatisfyed filter, callback not after add", async () => {
        //arrange 
        const mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(() => Promise.resolve([])),
            expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
            name: "mock"
        }
        const ctx = new DbContext({
            adapter: mockAdapter
        });
        const subscriptionFunc = jest.fn();

        //act 
        const myTable = ctx.table("myTable");
        myTable.query({
            columns: "*",
            where: [{
                "col1": {
                    [Op.eq]: "val1"
                },
                "col2": {
                    [Op.gt]: 0,
                    [Op.lt]: 10
                },
                "col3": {
                    [Op.isNull]: true
                },
                "col4": {
                    [Op.isNotNull]: true
                },
                "col5": {
                    [Op.neq]: 0
                },
                "col6": {
                    [Op.cont]: "%x%"
                }
            }]
        }).subscribe(subscriptionFunc);

        await myTable.actions().add({
            "id": 1,
            "col1": "val1",
            "col2": 5,
            "col3": null,
            "col4": 1,
            "col5": 1,
            "col6": "abc"
        }).execute();


        //assert 
        await sleep(0.1);
        expect(subscriptionFunc).toBeCalledTimes(1);
    });

    test("subscription, callback after add but not after unsubscribe", async () => {
        //arrange 
        const mockAdapter = {
            connect: jest.fn(),
            executeBulkSql: jest.fn(() => Promise.resolve([])),
            expectSql: jest.fn(() => Promise.resolve({ rows: [] })),
            name: "mock"
        }
        const ctx = new DbContext({
            adapter: mockAdapter
        });
        const subscriptionFunc = jest.fn();

        //act 
        const myTable = ctx.table("myTable");

        const qry = myTable.query({
            columns: "*",
            where: [{
                "col1": {
                    [Op.eq]: "val1"
                }
            }]
        }).subscribe(subscriptionFunc);

        await myTable.actions().add({
            "id": 1,
            "col1": "val1",
        }).execute();

        qry.unsubscribe();

        await myTable.actions().add({
            "id": 2,
            "col1": "val1",
        }).execute();


        //assert 
        await sleep(0.1);
        expect(subscriptionFunc).toBeCalledTimes(2);
    });

})