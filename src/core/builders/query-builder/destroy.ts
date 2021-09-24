export function destroy(tableName: string) {
    return `DELETE FROM ${tableName} WHERE id = ?;`
}

export function destroyAll(tableName: string) {
    return `DELETE FROM ${tableName};`
}

export default { destroy, destroyAll }