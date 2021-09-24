import { Row } from "../../../types";

export function update(tableName: string, row: Row) {
    const { id, ...props } = row;
    const values = Object.keys(props)
        .map(k => `${k} = ?`)
        .join(', ')

    return `UPDATE ${tableName} SET ${values} WHERE id = ?;`
}

export default { update }