import { Row } from '../../../types';

export function insert(tableName: string, row: Row) {
  const keys = Object.keys(row);
  const columns = keys.join(', ');
  const values = keys.map(() => '?').join(', ');

  return `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${values});`;
}

export function insertOrReplace(tableName, object) {
  return insert(tableName, object).replace(
    'INSERT INTO',
    'INSERT OR REPLACE INTO'
  );
}

export default { insert, insertOrReplace };
