import React from "react";
import { TextInput, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { useDbAction } from "../src/hooks/useDbAction";
import { useDbQuery } from "../src/hooks/useDbQuery";
import { DatabaseProvider } from "../src/components/database-provider";
import { IAdapter } from '../src/adapters/adapter';
import { DbContext } from '../src/core/db-context';
import { Op } from "../src/types";

describe("Hooks", () => {

    let mockAdapter: IAdapter = null;
    let database: DbContext = null;

    beforeEach(() => {
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

    test("useDbQuery re render when something changes", () => {
        //arrange
        const Root = ({ database }: { database: DbContext }) => {
            return (
                <DatabaseProvider database={database}>
                    <TestComp />
                </DatabaseProvider>
            )
        }
        const TestComp = () => {
            const result = useDbQuery({
                tableName: "myTable",
                where: [{
                    col1: {
                        [Op.eq]: "val1"
                    }
                }]
            });
            const txt = JSON.stringify(result);
            return <Text testID="text">{txt}</Text>
        }

        //act
        const { getByTestId } = render(<Root database={database} />);

        //assert
        expect(getByTestId("text").children).toStrictEqual(["[]"]);
    })
});