import { Color } from "../types/DataProto";

interface QueryLottery<T> {
  color: Color;
  user: T;
}

interface ResultLottery<T> {
  white: T;
  black: T;
}

/**
 * Lotery orientation pair
 * @param {QueryLottery}
 * @param {QueryLottery}
 * @returns {ResultLottery}
 */
function lotteryOrientations<U>(
  u1: QueryLottery<U>,
  u2: QueryLottery<U>
): ResultLottery<U> {
  /* lottery color figure */
  if (u1.color === "wb" && u2.color === "wb") {
    const invert = Math.random() > 0.5;
    return {
      black: invert ? u1.user : u2.user,
      white: invert ? u2.user : u1.user,
    };
  }

  if (u1.color !== "wb") {
    const invert = u1.color === "b";

    return {
      black: invert ? u1.user : u2.user,
      white: invert ? u2.user : u1.user,
    };
  }
  if (u2.color !== "wb") {
    const invert = u2.color === "w";

    return {
      black: invert ? u1.user : u2.user,
      white: invert ? u2.user : u1.user,
    };
  }
  throw new Error("lotteryOrientations: color invalid");
}

export default lotteryOrientations;
