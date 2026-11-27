// Turkey Run — screenshot / play-test hooks.
// These only drive the same state transitions the player can reach by
// playing (start, run, get caught, escape); they exist so an automated
// browser can photograph each real screen of the game. They change no rules.
import { CFG } from './config.js';
import { startRun } from './engine.js';

export function installShotsHook(game, input) {
  window.__turkeyRun = {
    game,
    input,
    state() {
      return game.state;
    },
    score() {
      return Math.floor(game.score);
    },
    distance() {
      return Math.floor(game.world.distance);
    },
    lives() {
      return game.lives;
    },
    // Begin a run exactly as the START button does.
    start() {
      if (game.state === 'title') startRun(game);
    },
    // Jump the run forward to just before the finish line, then the player
    // still has to run the last stretch for real to trigger ESCAPED.
    nearFinish() {
      if (game.state !== 'playing') startRun(game);
      game.world.distance = CFG.FINISH_M - 12;
      game.farmer.x = 46;
    },
    // Let the farmer catch Pip through the game's own catch path.
    letFarmerCatch() {
      if (game.state !== 'playing') startRun(game);
      game.farmer.x = game.player.x - 44;
    },
    // Drop Pip's lives to one heart so the next hit ends the run.
    oneLifeLeft() {
      game.lives = 1;
    },
  };
}
