export type SqlType = string | number | boolean | null;
export type Row = Record<string, SqlType>;

export type WhereOptionCondition = Record<keyof typeof Op, SqlType>;
export type WhereOption<T extends Row = Row> = Record<
  keyof T,
  Partial<WhereOptionCondition>
>;

export type QueryOptions<T extends Row = Row> = {
  columns?: (keyof T)[] | '*';
  page?: number;
  limit?: number;
  where?: WhereOption<T>[];
  order?: string[];
};

export type ColumnType =
  | 'INTEGER'
  | 'FLOAT'
  | 'TEXT'
  | 'NUMERIC'
  | 'BOOLEAN';
export type ColumnOptions = {
  type: ColumnType;
  primary_key?: boolean;
  unique?: boolean;
  not_null?: boolean;
  default?: SqlType
};

export type Callback<T> = (result: T[]) => void | Promise<void>;

export const Op = {
  eq: '=',
  neq: '<>',
  lt: '<',
  lteq: '<=',
  gt: '>',
  gteq: '>=',
  cont: 'LIKE',
  isNull: "IS NULL",
  isNotNull: "IS NOT NULL"
};