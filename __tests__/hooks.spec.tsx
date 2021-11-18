import React from "react";
import { TextInput, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { useDbAction } from "../src/hooks/useDbAction";
import { useDbQuery } from "../src/hooks/useDbQuery";
import { DatabaseProvider } from "../src/components/database-provider";
import { IAdapter } from '../src/adapters/adapter';
import { DbContext } from '../src/core/db-context';
import { Op, SqlType } from "../src/types";

const sleep = (seconds: number) => new Promise(r => setTimeout(r, seconds * 1000));
const mockReduce = jest.fn();
jest.mock('react', () => ({
    //@ts-ignore
    ...jest.requireActual('react'),
    useReducer: () => [null, mockReduce],
}));

describe("Hooks", () => {

    let mockAdapter: IAdapter = null;
    let database: DbContext = null;
    let rows: any[] = [{
        id: 1,
        col1: "val1"
    }];
    beforeEach(() => {
        mockAdapter = {
            connect: jest.fn(),
            //for insert
            executeBulkSql: jest.fn((sqls: string[], params: SqlType[][]) => {
                if (sqls[0].startsWith("INSERT")) {
                    rows.push({
                        id: params[0][0],
                        col1: params[0][1]
                    })
                    return Promise.resolve([{}]);
                }
                else if (sqls[0].startsWith("SELECT")) {
                    return Promise.resolve([{ rows: [...rows] }])
                }
            }),
            //for select
            expectSql: jest.fn((sqls: string, params: SqlType[]) => {
                if (sqls.startsWith("INSERT")) {
                    rows.push({
                        id: params[0],
                        col1: params[1]
                    })
                    return Promise.resolve({});
                }
                else if (sqls.startsWith("SELECT")) {
                    return Promise.resolve({ rows: [...rows] })
                }
            }),
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

    test("add operation using dbAction", () => {
        //arrange
        const Root = ({ database }: { database: DbContext }) => {
            return (
                <DatabaseProvider database={database}>
                    <TestComp />
                </DatabaseProvider>
            )
        }
        const TestComp = () => {
            const action = useDbAction({ tableName: "myTable" });
            return <TextInput testID="textInput" onChangeText={(val) => {
                action.add({
                    id: 1,
                    "col1": val
                }).execute();
            }}></TextInput>
        }

        //act
        const { getByTestId } = render(<Root database={database} />);
        fireEvent.changeText(getByTestId("textInput"), "val1");

        //assert
        expect(mockAdapter.executeBulkSql).toBeCalledWith([
            "INSERT OR REPLACE INTO myTable (id, col1) VALUES (?, ?);"],
            [[1, "val1"]]
        )
    })

    test("useDbQuery re render when something changes", async () => {
        //arrange
        const Root = ({ database }: { database: DbContext }) => {
            return (
                <DatabaseProvider database={database}>
                    <TestComp />
                </DatabaseProvider>
            )
        }
        const TestComp = () => {
            useDbQuery({
                tableName: "myTable",
                where: [{
                    col1: {
                        [Op.eq]: "val1"
                    }
                }]
            });
            return null;
        }

        //act
        render(<Root database={database} />);
        await database.table("myTable").actions().add({
            id: 2,
            col1: "val1"
        }).execute();

        //assert
        await sleep(0.5);
        expect(mockReduce).toBeCalledTimes(2);
    })
});