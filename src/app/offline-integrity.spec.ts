describe("OfflineIntegrity (CDN Checker)", () => {
    it("should ensure src/index.html does not load any external CDNs (100% offline-compatible)", async () => {
        // Use native browser fetch() with async/await to provide an elegant,
        // modern and typings-free test flow.
        try {
            const res = await fetch("/base/src/index.html");
            if (!res.ok) {
                throw new Error(`Failed to load index.html: ${res.statusText}`);
            }
            const htmlContent = await res.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");

            const scripts = Array.from(doc.getElementsByTagName("script"));
            const links = Array.from(doc.getElementsByTagName("link"));

            const externalPatterns = ["https://", "http://", "//"];

            scripts.forEach((script) => {
                const src = script.getAttribute("src");
                if (src) {
                    const hasExternal = externalPatterns.some((pattern) => src.startsWith(pattern));
                    expect(hasExternal).withContext(
                        `Error: src/index.html contains an unauthorized external CDN script source: "${src}". All dependencies must be bundled locally.`
                    ).toBeFalse();
                }
            });

            links.forEach((link) => {
                const href = link.getAttribute("href");
                if (href) {
                    const hasExternal = externalPatterns.some((pattern) => href.startsWith(pattern));
                    expect(hasExternal).withContext(
                        `Error: src/index.html contains an unauthorized external CDN stylesheet link: "${href}". All dependencies must be bundled locally.`
                    ).toBeFalse();
                }
            });
        } catch (err: any) {
            fail(`OfflineIntegrity: Could not parse index.html over Karma Server: ${err.message}`);
        }
    });
});
