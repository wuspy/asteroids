import { argv } from "process";
import * as bcrypt from "bcrypt";
import { storeReservedPlayerName } from "../db";

const BCRYPT_ROUNDS = 8;

const name = argv[2];
const pass = argv[3];

(async () => {
    const maskedPass = pass.charAt(0).padEnd(pass.length - 1, "*").concat(pass.charAt(pass.length - 1));
    console.log(`Storing reserved name "${name}" with password "${maskedPass}"...`);

    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(pass, salt);

    try {
        await storeReservedPlayerName(name, hash);
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
