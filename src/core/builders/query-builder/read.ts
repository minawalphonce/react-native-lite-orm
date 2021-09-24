import { QueryOptions, WhereOption, WhereOptionCondition, Row } from '../../../types';

const defaultOptions: QueryOptions = {
  columns: '*',
  page: null,
  limit: 30,
  where: [],
  order: ['id DESC'],
};

// Creates the "SELECT" sql statement for find one record
export function find(tableName: string) {
  return `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1;`;
}

/* Creates the "SELECT" sql statement for query records
 * Ex: qb.query({
 *   columns: 'id, nome, status',
 *   where: {status_eq: 'encerrado'}
 * })
 */
export function query<T extends Row = Row>(tableName: string, options: QueryOptions<T> = {}) {
  const { columns, page, limit, where, order } = {
    ...defaultOptions,
    ...options,
  };

  const whereStatement = queryWhere(where);

  let sqlParts = [
    'SELECT',
    columns === '*' ? '*' : columns.join(','),
    'FROM',
    tableName,
    whereStatement,
    'ORDER BY',
    order.join(','),
  ];
  if (page !== null) {
    sqlParts.push(
      ...['LIMIT', limit.toString(), 'OFFSET', (limit * (page - 1)).toString()]
    );
  }

  return sqlParts.filter((p) => p !== '').join(' ');
}

// Build where query
export function queryWhere(options: WhereOption[]) {
  const ors = options.map((where) => {
    const ands = Object.entries(where).map(([col, cond]) =>
      propertyOperation(col, cond)
    );
    return ands.length > 0 ? '(' + ands.join(' AND ') + ')' : '';
  });
  return ors.length > 0 ? `WHERE ${ors.join(' OR ')}` : '';
}

// Convert operators to database syntax
export function propertyOperation(
  col: string,
  condition: Partial<WhereOptionCondition>
) {
  return Object.keys(condition)
    .map((op) => {
      const operation = op.toString();
      return `${col} ${operation} ?`;
    })
    .join(' AND ');
}

export default { find, query };
