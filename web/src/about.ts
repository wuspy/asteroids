const message = document.getElementById("fallback-message")!;

console.log(message);

if (document.referrer.includes(window.location.host)) {
    message.innerHTML = "This site has some pretty cool stuff if you open it on a desktop or laptop computer instead of a phone :)";
} else {
    message.innerHTML =
        `<a href="${window.location.protocol}//${window.location.host}" class="inline-flex">
            <svg viewBox="0 0 24 24" class="w-4 mr-2" aria-hidden="true">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path>\
            </svg>
            ${window.location.host} homepage
        </a>`;
}

export {};
