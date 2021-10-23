import { Row, WhereOption, Op, SqlType } from '../../../types';

export type Operation = (row: Row) => boolean;

const opMapping: Record<
  string,
  (attr: string, value: SqlType, next: Operation) => Operation
> = {
  [Op.eq]: (attr, value, next) => {
    const eqop = (row: Row) => {
      //console.log("eq", row, row[attr] === value)
      if (row[attr] === value) return next(row);
      return false;
    };
    eqop.name = "eq";
    return eqop;
  },
  [Op.gt]: (attr, value, next) => {
    const gtop = (row: Row) => {
      //console.log("gt", row)
      if (row[attr]! > value!) return next(row);
      return false;
    };
    gtop.name = "gt";
    return gtop;
  },
  [Op.gteq]: (attr, value, next) => {
    const gteqop = (row: Row) => {
      //console.log("gteq", row)
      if (row[attr]! >= value!) return next(row);
      return false;
    };
    gteqop.name = "gteq";
    return gteqop;
  },
  [Op.lt]: (attr, value, next) => {
    const ltop = (row: Row) => {
      //console.log("lt", row)
      if (row[attr]! < value!) return next(row);
      return false;
    };
    ltop.name = "lt";
    return ltop;
  },
  [Op.lteq]: (attr, value, next) => {
    const lteqop = (row: Row) => {
      //console.log("lteq", row)
      if (row[attr]! <= value!) return next(row);
      return false;
    };
    lteqop.name = "lteq";
    return lteqop;
  },
  [Op.neq]: (attr, value, next) => {
    const neqop = (row: Row) => {
      //console.log("neq", row)
      if (row[attr] !== value) return next(row);
      return false;
    };
    neqop.name = "neq";
    return neqop;
  },
  [Op.cont]: (attr, value, next) => {
    const contop = (row: Row) => {
      let v = (value || "").toString().toLowerCase();
      v = v?.replace(/%/g, "");
      //console.log("cont", v)
      if (row[attr]?.toString().toLowerCase()
        .indexOf(v) !== -1
      )
        return next(row);
      return false;
    };
    contop.name = "cont";
    return contop;
  },
  [Op.isNull]: (attr, value, next) => {
    const isNullop = (row: Row) => {
      //console.log("isNullop", row)
      if (row[attr] === null)
        return next(row);
      return false;
    }
    isNullop.name = "isNull";
    return isNullop;
  },
  [Op.isNotNull]: (attr, value, next) => {
    const isNotNullop = (row: Row) => {
      //console.log("isNullop", row)
      if (row[attr] !== null)
        return next(row);
      return false;
    }
    isNotNullop.name = "isNotNull";
    return isNotNullop;
  }
};

const andNoop = (row: Row) => {
  //console.log("andNoop")
  return true
};
andNoop.name = "andNoop";

const orNoop = (row: Row) => {
  //console.log("orNoop")
  return false
};
orNoop.name = "orNoop";

const createFilterOperation = (where: WhereOption[]) => {
  const rootOp = where.reduce(
    (nextForRoot /*previous value*/, subWhere) => {
      const rootOperation = Object.entries(subWhere).reduce(
        (nextForAttr, [attr, conditions]) => {
          const attrOperation = Object.entries(conditions).reduce(
            (nextForCondition, [op, value]) => {
              //@ts-ignore
              return opMapping[op](attr, value, nextForCondition);
            },
            andNoop
          );

          const attrRootOp = (row: Row) => {
            //console.log("attrRoot", row);
            if (attrOperation(row)) return nextForAttr(row);
            return false;
          };
          attrRootOp.name = "attrRoot";
          return attrRootOp;
        },
        andNoop
      );

      const orRootOp = (row: Row) => {
        //console.log("orRoot", row);
        if (rootOperation(row)) return true;
        return nextForRoot(row);
      };
      orRootOp.name = "orRoot";
      return orRootOp;
    },
    orNoop // initial value
  );
  return rootOp;
};

export default {
  toFilterExpression: createFilterOperation,
};
