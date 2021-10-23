import { QueryOptions, WhereOption, WhereOptionCondition, Row, Op } from '../../../types';

const defaultOptions: QueryOptions = {
  columns: '*',
  where: [],
};


export function query<T extends Row = Row>(tableName: string, options: QueryOptions<T> = {}) {
  const { columns, page, limit, where, order } = {
    ...defaultOptions,
    ...options,
  };

  const whereStatement = where ? queryWhere(where) : "";
  let sqlParts = [
    'SELECT',
    columns === '*' ? '*' : columns?.join(','),
    'FROM',
    tableName,
    whereStatement
  ];
  if (order && order.length) {
    sqlParts.push(...['ORDER BY', order.join(',')])
  }
  if (limit) {
    sqlParts.push(...['LIMIT', limit?.toString()]);
  }
  if (limit && page)
    sqlParts.push(...['OFFSET', ((page - 1) * limit).toString()]);

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
      return `${col} ${operation} ${(op === Op.isNotNull || op === Op.isNull) ? "" : "?"}`;
    })
    .join(' AND ');
}

export default { query };
