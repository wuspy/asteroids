import { argv } from "process";
import { storePlayerNameFilter } from "../db";
import { PlayerNameFilterAction } from "../db/schema";

const phrase = argv[2];
const actionString = argv[3];

(async () => {
    let action: PlayerNameFilterAction;
    switch (actionString) {
        case "w":
            action = PlayerNameFilterAction.WhitelistExactMatch;
            break;
        case "be":
            action = PlayerNameFilterAction.BlacklistExactMatch;
            break;
        case "bc":
            action = PlayerNameFilterAction.BlacklistContains;
            break;
        default:
            console.error(`Invalid filter action "${actionString}"`);
            process.exit();
    }
    console.log(`Storing filter "${phrase}" with action ${actionString} (${action})...`);

    try {
        await storePlayerNameFilter(phrase, action);
    } catch (e) {
        if (e instanceof Error) {
            console.error(`Error: ${e.message}`);
        } else {
            console.error(`Error: ${e}`);
        }
        process.exit();
    }

    console.log("Done");
    process.exit();
})();
