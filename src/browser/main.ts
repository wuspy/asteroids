/**
 * The main entry point for the browser app, transpiled to es5 and emitted inline on index.html. Its only purpose
 * is to check if the browser supports the required features before loading asteroids.js, and if not to display
 * some fallback content.
 */

const fallbackContent = document.getElementById("fallback-content")!;

const supportsES6 = () => {
    try {
        eval("class a{}; const b = () => 1;")
    } catch (e) {
        return false;
    }
    return true;
}

const supportsWebgl = () => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    return !!gl && gl instanceof WebGLRenderingContext;
}

// Required for the wasm build of yoga. If using the asm.js build this can be removed.
const supportsWasm = () => typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";

if (!supportsES6() || !supportsWebgl() || !supportsWasm()) {
    // By default unsupportedMessage says javascript is disabled, so change it
    const unsupportedMessage = document.getElementById("unsupported-message")!;
    unsupportedMessage.innerHTML = "This site has some pretty cool stuff on it, but you need to be using a newer web browser to see it. You can check out what my site actually looks like <a href=\"https://github.com/wuspy/asteroids\" target=\"_blank\">here</a>.";
    // Show fallback content
    fallbackContent.style.display = "flex";
} else {
    const loader = document.getElementById("loader-placeholder")!;
    const game = document.getElementById("game")!;
    const branding = document.getElementById("branding")!;

    // Don't need this anymore, so might as well not have it cluttering the dom
    fallbackContent.parentNode!.removeChild(fallbackContent);
    // Show spinny loader
    loader.id = "loader";
    // Show branding line at bottom of screen
    branding.style.visibility = "visible";
    // Enable interaction on game div
    game.style.pointerEvents = "auto";
    // Load script
    const s = document.createElement("script");
    s.src = `asteroids.js?v=${process.env.npm_package_version}`;
    document.body.appendChild(s);
}
