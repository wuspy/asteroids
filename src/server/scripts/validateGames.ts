import { argv } from "process";
import { validateAsteroidsGame } from "../asteroidsGameValidator";
import { findAllGames } from "../db";

const stdout = process.stdout;
const offset = parseInt(argv[2] ?? 0);
const limit = parseInt(argv[3] ?? 1000);

if (isNaN(offset) || isNaN(limit)) {
    console.error("Invalid arguments");
    process.exit();
}

(async () => {
    const games = await findAllGames(offset, limit);
    stdout.write(`Verifying ${games.length} games...\n`);
    let passed = 0, failed = 0;
    const start = performance.now();
    for (const game of games) {
        stdout.write(`  - Game #${game.id} [v${game.version}]...`);
        const valid = validateAsteroidsGame(game, true);
        if (valid) {
            stdout.write("  OK\n");
            passed++;
        } else {
            stdout.write("  FAILED\n");
            failed++;
        }
    }
    const elapsed = performance.now() - start;
    stdout.write(`${passed} passed/${failed} failed in ${elapsed.toFixed()}ms\n`);
    process.exit();
})();
