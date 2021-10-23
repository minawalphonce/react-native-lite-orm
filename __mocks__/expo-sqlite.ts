//import { WebSQLDatabase } from "expo-sqlite";

const openDatabase = jest.fn((databaseName: string) => {
    return {
        transaction: jest.fn()
    }
});

export {
    openDatabase
}