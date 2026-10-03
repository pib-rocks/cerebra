import {
    CLOUD_TOKEN_API_NAME,
    DEFAULT_PROVIDER_REF,
    isCapabilityControlDisabled,
    isProviderConfigured,
    isProviderOptionDisabled,
    personalityAttention,
    personalityNeedsAttention,
    providerIdOf,
    providerKeyAccounts,
    attachProvider,
    retiredModelNotice,
    providerOptionValue,
    providerRefFromSelection,
    providersForSelection,
    resolveProvider,
    ProviderSelectionRow,
} from "./provider-registry";

function row(
    id: number,
    images: boolean,
    isDefault: boolean,
    apiName = "shared-api",
    credentialRef: string | null = `provider-${id}`,
): ProviderSelectionRow & {apiName: string} {
    return {
        id,
        apiName,
        isDefault,
        credentialRef,
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

    it("offers a provider only while its key is stored", () => {
        const keyed = row(4, true, false, "openai");
        const missing = row(5, true, false, "gemini", null);
        expect(
            providersForSelection([keyed, missing], null).map(
                (model) => model.id,
            ),
        ).toEqual([keyed.id]);
        expect(
            providersForSelection([keyed, missing], String(missing.id)).map(
                (model) => model.id,
            ),
        ).toEqual([keyed.id, missing.id]);
    });

    it("treats the cloud row as the SmartConnect token, not a pasted key", () => {
        const cloud = row(6, true, true, CLOUD_TOKEN_API_NAME, null);
        expect(CLOUD_TOKEN_API_NAME).toBe("pib-cloud");
        expect(isProviderConfigured(cloud, false)).toBeFalse();
        expect(isProviderConfigured(cloud, true)).toBeTrue();
        cloud.credentialRef = "provider-6";
        expect(isProviderConfigured(cloud, false)).toBeFalse();
        expect(
            providersForSelection([cloud], null, true).map((m) => m.id),
        ).toEqual([cloud.id]);
        expect(providersForSelection([cloud], null, false)).toEqual([]);
    });

    it("does not mark a default personality on pib.Cloud as needing a provider key", () => {
        const cloud = row(10, true, true, "pib-cloud", null);
        const keyed = row(7, true, false, "gemini", "provider-7");
        const missing = row(8, true, false, "gpt-6", null);
        expect(
            personalityNeedsAttention(
                DEFAULT_PROVIDER_REF,
                [cloud, keyed, missing],
                true,
            ),
        ).toBeFalse();
        expect(
            personalityAttention(
                DEFAULT_PROVIDER_REF,
                [cloud, keyed, missing],
                true,
            ),
        ).toBeNull();
        expect(
            personalityNeedsAttention(
                String(keyed.id),
                [cloud, keyed, missing],
                true,
            ),
        ).toBeFalse();
        expect(
            personalityNeedsAttention(
                String(missing.id),
                [cloud, keyed, missing],
                true,
            ),
        ).toBeTrue();
        expect(
            personalityAttention(
                String(missing.id),
                [cloud, keyed, missing],
                true,
            )?.reason,
        ).toBe("missing-key");
    });

    it("marks a personality when its provider key is deleted and clears the mark when the key returns", () => {
        const model = row(7, true, false, "mistral");
        expect(
            personalityNeedsAttention(String(model.id), [model], false),
        ).toBeFalse();
        model.credentialRef = null;
        expect(
            personalityNeedsAttention(String(model.id), [model], false),
        ).toBeTrue();
        expect(providersForSelection([model], null)).toEqual([]);
        model.credentialRef = "provider-7";
        expect(
            personalityNeedsAttention(String(model.id), [model], false),
        ).toBeFalse();
        expect(providersForSelection([model], null).map((m) => m.id)).toEqual([
            model.id,
        ]);
    });

    it("does not offer a retired model for a new selection and marks one that still uses it", () => {
        const current = row(2, true, false, "gpt-6");
        const gone = row(4, true, false, "retired-entry");
        gone.retired = true;
        gone.visualName = "Retired entry";
        expect(
            providersForSelection([current, gone], null).map(
                (model) => model.id,
            ),
        ).toEqual([current.id]);
        expect(
            providersForSelection([current, gone], String(gone.id)).map(
                (model) => model.id,
            ),
        ).toEqual([current.id, gone.id]);
        expect(isProviderOptionDisabled(gone, true)).toBeTrue();
        expect(isProviderOptionDisabled(current, true)).toBeFalse();
        expect(
            personalityNeedsAttention(String(gone.id), [current, gone], true),
        ).toBeTrue();
        expect(retiredModelNotice(gone)).toBe(
            "Retired entry is gone. Choose a new one.",
        );
        expect(
            personalityNeedsAttention(
                String(current.id),
                [current, gone],
                true,
            ),
        ).toBeFalse();
        expect(personalityNeedsAttention("9", [], false, true)).toBeTrue();
        expect(personalityNeedsAttention("9", [], false, false)).toBeFalse();
        const removed = personalityAttention("9", [current], true, true);
        expect(removed?.reason).toBe("retired");
        expect(removed?.notice).toBe("This model is gone. Choose a new one.");
    });

    it("keeps the credential and the endpoint on the provider and the flags on the model", () => {
        const gpt = {
            id: 8,
            providerId: 2,
            providerName: "OpenAI",
            apiName: "gpt-6",
            visualName: "GPT-6",
            isDefault: false,
            endpointBase: "https://api.openai.example/v1",
            credentialRef: "provider-2",
            capabilities: {
                tools: true,
                images: true,
                live: false,
                stt: false,
                tts: false,
            },
        };
        const realtime = {
            id: 11,
            providerId: 2,
            providerName: "OpenAI",
            apiName: "gpt-realtime",
            visualName: "GPT Realtime",
            isDefault: false,
            endpointBase: "https://api.openai.example/v1",
            credentialRef: "provider-2",
            capabilities: {
                tools: false,
                images: false,
                live: true,
                stt: false,
                tts: false,
            },
        };
        expect(providerKeyAccounts([gpt, realtime])).toEqual([
            {
                id: 2,
                name: "OpenAI",
                endpointBase: "https://api.openai.example/v1",
                credentialRef: "provider-2",
                capabilities: {
                    tools: false,
                    images: false,
                    live: false,
                    stt: false,
                    tts: false,
                },
                modelIds: [8, 11],
            },
        ]);
        const selected = resolveProvider("8", [gpt, realtime]);
        expect(selected?.id).toBe(8);
        expect(providerIdOf(selected!)).toBe(2);
        expect(selected?.capabilities?.images).toBeTrue();
        expect(realtime.capabilities.live).toBeTrue();

        const joined = attachProvider(
            {
                id: 10,
                providerId: 4,
                apiName: "pib-cloud",
                visualName: "pib.Cloud",
                capabilities: gpt.capabilities,
            },
            [
                {
                    id: 4,
                    name: "pib.Cloud",
                    endpointBase: null,
                    credentialRef: "provider-10",
                    capabilities: gpt.capabilities,
                },
            ],
        );
        expect(joined.credentialRef).toBe("provider-10");
        expect(joined.endpointBase).toBeNull();
        expect(joined.providerName).toBe("pib.Cloud");
        expect(joined.capabilities).toEqual(gpt.capabilities);
        expect(providerIdOf(joined)).toBe(4);
        expect(providerRefFromSelection(String(selected!.id)).providerRef).toBe(
            "8",
        );
    });
});
