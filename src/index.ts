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

if (!supportsES6() || !supportsWebgl()) {
    const message = document.getElementById("unsupported-message")!;
    message.innerHTML = "Your web browser is not supported";
    // for (let i = 0; i < message.children.length; i++) {
    //     message.children[i].innerHTML = "Your web browser is not supported";
    // }
} else {
    document.getElementById("unsupported-message")!.remove();
    document.getElementById("loader-placeholder")!.id = "loader";
    const s = document.createElement("script");
    s.src = `asteroids.js?v=${process.env.npm_package_version}`;
    document.getElementsByTagName("body")[0].appendChild(s);
}
