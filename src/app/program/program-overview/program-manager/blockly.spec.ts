import {toolbox} from "./blockly";

/**
 * Extracts the toolbox entry for one block type and parses it as XML.
 *
 * The toolbox root element carries a malformed `style` attribute that
 * predates this spec, so the document as a whole does not parse as strict
 * XML. Only the block's own fragment is parsed here (see PR-1856).
 */
function parseToolboxBlock(type: string): Element {
    const openTag = `<block type="${type}">`;
    const selfClosing = `<block type="${type}"></block>`;

    if (toolbox.includes(selfClosing)) {
        return parseFragment(selfClosing);
    }

    const start = toolbox.indexOf(openTag);
    expect(start)
        .withContext(`toolbox has no entry for block "${type}"`)
        .toBeGreaterThanOrEqual(0);

    // The palette does not nest <block> inside <block> for this entry, so
    // the first closing tag after the opening tag ends the fragment.
    const closeTag = "</block>";
    const end = toolbox.indexOf(closeTag, start);
    expect(end)
        .withContext(`toolbox entry for "${type}" is not closed`)
        .toBeGreaterThan(start);

    return parseFragment(toolbox.slice(start, end + closeTag.length));
}

function parseFragment(fragment: string): Element {
    const doc = new DOMParser().parseFromString(fragment, "text/xml");
    const parseError = doc.querySelector("parsererror");
    expect(parseError)
        .withContext(`fragment is not well-formed XML: ${fragment}`)
        .toBeNull();
    return doc.documentElement;
}

describe("toolbox", () => {
    describe("play_audio_from_speech entry", () => {
        let block: Element;

        beforeEach(() => {
            block = parseToolboxBlock("play_audio_from_speech");
        });

        it("has a shadow text on the TEXT_INPUT value input", () => {
            const value = block.querySelector('value[name="TEXT_INPUT"]');
            expect(value)
                .withContext('expected a <value name="TEXT_INPUT">')
                .not.toBeNull();

            const shadow = value!.querySelector('shadow[type="text"]');
            expect(shadow)
                .withContext('expected a <shadow type="text"> on TEXT_INPUT')
                .not.toBeNull();
        });

        it("leaves the shadow text field empty", () => {
            const field = block.querySelector(
                'value[name="TEXT_INPUT"] > shadow[type="text"] > field[name="TEXT"]',
            );
            expect(field).not.toBeNull();
            expect(field!.textContent).toBe("");
        });
    });
});
