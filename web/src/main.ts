// TODO add mobile redirect or get rid of this
const redirect = false;

if (redirect) {
    window.location.href = "/about.html";
} else {
    document.getElementById("loader-placeholder")!.id = "loader";
    document.getElementById("branding")!.style.visibility = "visible";
    import("./asteroids.tsx").then(asteroids => asteroids.run());
}

export {}
