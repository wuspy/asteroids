/** @type {import("tailwindcss").Config} */
export default {
    content: ["./about.html", "./src/about.ts"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "yellow": "#FFF208",
                "pink": "#FF2965",
                "green": "#57EB64",
                "red": "#FF1231",
                "blue": "#31A6FA",
                "dark-blue": "#0D63F8",
            },
        },
    },
    plugins: [],
}
