import {
    DEFAULT_PROVIDER_REF,
    isCapabilityControlDisabled,
    providerOptionValue,
    providerRefFromSelection,
    providersForSelection,
    ProviderSelectionRow,
} from "./provider-registry";

function row(
    id: number,
    images: boolean,
    isDefault: boolean,
    apiName = "shared-api",
): ProviderSelectionRow & {apiName: string} {
    return {
        id,
        apiName,
        isDefault,
        capabilities: {
            tools: true,
            images,
            live: false,
            stt: false,
            tts: false,
        },
    };
}

describe("provider registry selection", () => {
    const text = row(1, false, false);
    const vision = row(2, true, false);
    const fallback = row(3, true, true, "other-api");

    it("does not offer a row without the images capability", () => {
        const offered = providersForSelection([text, vision, fallback], null);
        expect(offered.map((model) => model.id)).toEqual([2, 3]);
    });

    it("filters by the images flag when two rows share an api name", () => {
        const offered = providersForSelection([text, vision], null);
        expect(text.apiName).toBe(vision.apiName);
        expect(offered.map((model) => model.id)).toEqual([vision.id]);
    });

    it("keeps a stored id that no longer has images, and disables that control", () => {
        const offered = providersForSelection([text, vision], String(text.id));
        expect(offered.map((model) => model.id)).toEqual([vision.id, text.id]);
        expect(isCapabilityControlDisabled(text, "images")).toBeTrue();
        expect(isCapabilityControlDisabled(vision, "images")).toBeFalse();
        expect(isCapabilityControlDisabled(vision, "live")).toBeTrue();
    });

    it("stores default as a pointer for a new personality", () => {
        expect(providerOptionValue(fallback, null)).toBe(DEFAULT_PROVIDER_REF);
        expect(providerRefFromSelection(DEFAULT_PROVIDER_REF)).toEqual({
            providerRef: DEFAULT_PROVIDER_REF,
            assistantModelId: null,
        });
    });

    it("does not rewrite the pointer when a different row becomes the default", () => {
        const previousDefault = row(3, true, true, "other-api");
        const nextDefault = row(2, true, false);
        const stored = providerRefFromSelection(
            providerOptionValue(previousDefault, null),
        );
        previousDefault.isDefault = false;
        nextDefault.isDefault = true;
        expect(stored.providerRef).toBe(DEFAULT_PROVIDER_REF);
        expect(stored.assistantModelId).toBeNull();
        expect(providerOptionValue(nextDefault, stored.providerRef)).toBe(
            DEFAULT_PROVIDER_REF,
        );
        expect(providerOptionValue(previousDefault, stored.providerRef)).toBe(
            String(previousDefault.id),
        );
    });

    it("stores an explicit selection as that row id", () => {
        expect(providerOptionValue(vision, null)).toBe(String(vision.id));
        expect(providerRefFromSelection(String(vision.id))).toEqual({
            providerRef: String(vision.id),
            assistantModelId: vision.id,
        });
    });

    it("keeps an existing id when that row is the current default", () => {
        expect(providerOptionValue(fallback, String(fallback.id))).toBe(
            String(fallback.id),
        );
    });
});
