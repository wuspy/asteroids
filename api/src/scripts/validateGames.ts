import { argv } from "process";
import { validateAsteroidsGame } from "../asteroidsGameValidator";
import { findAllGames, findGameLog } from "../db";

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
        const log = await findGameLog(game.id);
        stdout.write(`  - Game #${game.id} [v${game.version}]...`);
        const result = validateAsteroidsGame({
            ...game,
            log: log!,
        });
        if (result.success) {
            stdout.write("  OK\n");
            passed++;
        } else {
            stdout.write(`  FAILED (${result.error})\n`);
            failed++;
        }
    }
    const elapsed = performance.now() - start;
    stdout.write(`${passed} passed/${failed} failed in ${elapsed.toFixed()}ms\n`);
    process.exit();
})();
