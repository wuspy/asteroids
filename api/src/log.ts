import chalk from "chalk";

export const info = (message: string) => console.log(message);
export const warn = (message: string) => console.log(chalk.yellow(message));
export const err = (message: string) => console.log(chalk.red(message));
export const success = (message: string) => console.log(chalk.green(message));
