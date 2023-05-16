import ismobilejs from "ismobilejs";

if (ismobilejs().phone) {
    window.location.href = "/about.html";
} else {
    const asteroids = import("./asteroids.tsx");
    window.addEventListener("load", async () => {
        document.getElementById("loader-placeholder")!.id = "loader";
        (await asteroids).run();
    });
}

export {}
