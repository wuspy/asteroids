import ismobilejs from "ismobilejs";

if (ismobilejs().phone) {
    window.location.replace("/about.html");
} else {
    const asteroids = import("./asteroids.tsx");
    window.addEventListener("DOMContentLoaded", async () => {
        document.getElementById("loader-placeholder")!.id = "loader";
        (await asteroids).run();
    });
}

export {}
