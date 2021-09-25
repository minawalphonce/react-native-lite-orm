import { Row, WhereOption, Op, SqlType } from '../../../types';

export type Operation = (row: Row) => boolean;

const opMapping: Record<
  string,
  (attr: string, value: SqlType, next?: Operation) => Operation
> = {
  [Op.eq]: (attr, value, next) => {
    return (row) => {
      if (row[attr] === value) return next(row);
      return false;
    };
  },
  [Op.gt]: (attr, value, next) => {
    return (row) => {
      if (row[attr] > value) return next(row);
      return false;
    };
  },
  [Op.gteq]: (attr, value, next) => {
    return (row) => {
      if (row[attr] >= value) return next(row);
      return false;
    };
  },
  [Op.lt]: (attr, value, next) => {
    return (row) => {
      if (row[attr] < value) return next(row);
      return false;
    };
  },
  [Op.lteq]: (attr, value, next) => {
    return (row) => {
      if (row[attr] <= value) return next(row);
      return false;
    };
  },
  [Op.neq]: (attr, value, next) => {
    return (row) => {
      if (row[attr] !== value) return next(row);
      return false;
    };
  },
  [Op.cont]: (attr, value, next) => {
    return (row) => {
      if (
        row[attr]
          .toString()
          .toLowerCase()
          .indexOf(value.toString().toLowerCase()) !== -1
      )
        return next(row);
      return false;
    };
  },
};

const createFilterOperation = (where: WhereOption[]) => {
  const rootOp = where.reduce(
    (nextForRoot, subWhere) => {
      const rootOperation = Object.entries(subWhere).reduce(
        (nextForAttr, [attr, conditions]) => {
          const attrOperation = Object.entries(conditions).reduce(
            (nextForCondition, [op, value]) => {
              return opMapping[op](attr, value, nextForCondition);
            },
            (row: Row) => true
          );

          return (row: Row) => {
            if (attrOperation(row)) return nextForAttr(row);
            return false;
          };
        },
        (row: Row) => true
      );

      return (row: Row) => {
        if (rootOperation(row)) return true;
        return nextForRoot(row);
      };
    },
    (row: Row) => true
  );
  return rootOp;
};

export default {
  toFilterExpression: createFilterOperation,
};
