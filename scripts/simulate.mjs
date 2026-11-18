import { DECKS } from '../src/cards.js';
import { createGame, applyAction, chooseAIAction, legalActions } from '../src/engine.js';
const seedsPerPair = Number(process.argv[2] || 12);
if (!Number.isInteger(seedsPerPair) || seedsPerPair < 1 || seedsPerPair > 100) throw new Error('每组种子数量须为 1 到 100 的整数');
const results = { seedsPerPair, policy: 'normal-vs-normal; row deck goes first', rows: [], finished: 0, unfinished: 0, turns: 0, emptyTurns: 0 };
for (const player of DECKS) {
  const row = { deckId: player.id, wins: {}, averageRounds: 0 };
  let rounds = 0;
  for (const opponent of DECKS) {
    let wins = 0;
    for (let i = 1; i <= seedsPerPair; i++) {
      let game = createGame({ deckId: player.id, opponentDeckId: opponent.id, difficulty: 'normal', seed: i * 7919 + 12345 });
      let count = 0, lastTurn = 0;
      while (game.status === 'playing' && count++ < 900) {
        if (game.turn !== lastTurn) {
          lastTurn = game.turn;
          results.turns++;
          if (legalActions(game).every(action => action.type === 'end')) results.emptyTurns++;
        }
        game = applyAction(game, chooseAIAction(game, 'normal'));
      }
      if (game.status === 'finished') results.finished++; else results.unfinished++;
      if (game.winner === 0) wins++; else if (game.winner === 'draw') wins += .5;
      rounds += Math.ceil(game.turn / 2);
    }
    row.wins[opponent.id] = wins / seedsPerPair;
  }
  row.averageRounds = Number((rounds / (seedsPerPair * DECKS.length)).toFixed(1));
  results.rows.push(row);
}
console.log(JSON.stringify(results, null, 2));
if (results.unfinished) process.exitCode = 1;
