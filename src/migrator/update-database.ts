import { DbSchema } from "../core/db-schema";

export type Migration = {
    name: string,
    up: (schema: DbSchema) => void,
    down?: () => void
}

export async function updateDatabase(schema: DbSchema, migrationsList: Migration[]) {
    const migrationTableExists = await schema.tableExists("__migrations");
    let ndx = 0;
    if (migrationTableExists) {
        const migrations = await schema.query("__migrations", { order: ["ndx"] }).fetch();
        while (ndx < migrations.length) {
            if (migrationsList[ndx].name !== migrations[ndx].name)
                throw new Error(`database migrations missmatch, database migrations are ${JSON.stringify(migrations.map(m => m["name"]))} but the defined one are ${JSON.stringify(migrationsList.map(m => m.name))}`);
            ndx++;
        }
    }
    else {
        schema.createTable("__migrations", {
            name: {
                type: "TEXT",
            },
            ndx: {
                type: "NUMERIC"
            }
        });
    }
    // ==================================
    const migrationTable = schema.action("__migrations");
    while (ndx < migrationsList.length) {
        const migration = migrationsList[ndx];
        await migration.up(schema);
        migrationTable.add({
            name: migration.name,
            ndx: ndx
        });
        ndx++;
    }
}