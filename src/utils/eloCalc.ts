// let k = 25; /* default beginner coefficient equal high 25 */
//   if (elo > 2400) /* for professional coefficient equal low 10 */ k = 10;
//   else if (elo > 1500) /* for enthusiast coefficient equal middle 12 */ k = 15;

function calcElo(
  whiteElo: number,
  blackElo: number,
  status: 1 | 0 | 0.5,
  k = 15
): {
  white: number;
  black: number;
} {
  if (whiteElo > blackElo) {
    const difference = whiteElo - blackElo;

    let wo = 1;
    if (difference < 600)
      wo = -0.0000012293 * difference * difference + 0.0015514193 * difference + 0.5;

    const minus = Math.round(k * (status - wo));
    return {
      white: minus,
      black: -minus,
    };
  }
  if (blackElo > whiteElo) {
    const difference = blackElo - whiteElo;

    let wo = 1;
    if (difference < 600)
      wo = -0.0000012293 * difference * difference + 0.0015514193 * difference + 0.5;

    const minus = Math.round(k * (1 - status - wo));
    return {
      white: -minus,
      black: minus,
    };
  }
  let minus = 0;
  if (status === 1) minus = -k;
  else if (status === 0) minus = k;
  return {
    white: -minus,
    black: minus,
  };
}

export default calcElo;
