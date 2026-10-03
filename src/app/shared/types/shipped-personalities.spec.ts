import mockData from "../../../../server/json-server-database.json";
import {AssistantModel} from "./assistantModel";
import {VoiceAssistant} from "./voice-assistant";
import {
    CLOUD_TOKEN_API_NAME,
    DEFAULT_PROVIDER_REF,
    attachProvider,
    capabilitiesHeldByAll,
    isProviderOptionDisabled,
    personalityAttention,
    providerIdOf,
    providersForSelection,
    resolveProvider,
} from "./provider-registry";

const CATALOGUE = [
    {
        apiName: "gemini-3.8-flash",
        visualName: "Gemini 3.8 Flash",
        isDefault: false,
    },
    {
        apiName: "gpt-6",
        visualName: "GPT-6",
        isDefault: false,
    },
    {
        apiName: "claude-sonnet-5-5",
        visualName: "Claude Sonnet 5.5",
        isDefault: false,
    },
    {
        apiName: "pib-cloud",
        visualName: "pib.Cloud",
        isDefault: true,
    },
];

describe("shipped personalities", () => {
    const models = mockData.assistantModel.map((row) =>
        AssistantModel.parseDtoToAssistantModel(
            attachProvider(row, mockData.provider),
        ),
    );

    function shipped(
        row: (typeof mockData.personality)[number],
    ): VoiceAssistant {
        return new VoiceAssistant(
            row.personalityId,
            row.name,
            row.gender,
            row.pauseThreshold,
            row.description,
            row.assistantModelId,
            row.messageHistory,
            row.providerRef,
            row.channel,
        );
    }

    it("carries only the backend catalogue", () => {
        expect(
            models.map((model) => ({
                apiName: model.apiName,
                visualName: model.visualName,
                isDefault: model.isDefault,
            })),
        ).toEqual(CATALOGUE);
        expect(models.map((model) => model.apiName)).not.toContain(
            "hermes-agent",
        );
        expect(models.every((model) => model.retired === false)).toBeTrue();
        const cloud = models.find((model) => model.isDefault);
        expect(cloud?.apiName).toBe("pib-cloud");
        expect(cloud?.credentialRef).toBe("provider-10");
        expect(
            models
                .filter(
                    (model) =>
                        model.credentialRef != null &&
                        model.credentialRef !== "",
                )
                .map((model) => model.apiName),
        ).toEqual(["pib-cloud"]);
    });

    it("loads Eva and Tom on pib.Cloud, which is the default route", () => {
        const personas = mockData.personality.map((row) => shipped(row));
        expect(personas.map((persona) => persona.name)).toEqual(["Eva", "Tom"]);
        expect(personas[0].gender).toBe("Female");
        expect(personas[0].pauseThreshold).toBe(0.5);
        expect(personas[0].messageHistory).toBe(15);
        expect(personas[0].description).toBe("You are a helpful assistant.");
        expect(personas[0].channel).toBe("smart");
        expect(personas[1].gender).toBe("Male");
        expect(personas[1].pauseThreshold).toBe(0.9);
        expect(personas[1].messageHistory).toBe(5);
        expect(personas[1].description).toBe("You are a helpful assistant.");
        expect(personas[1].channel).toBe("direct");

        for (const persona of personas) {
            expect(persona.providerRef).toBe(DEFAULT_PROVIDER_REF);
            expect(persona.assistantModelId).toBeNull();
            expect(persona.needsNewModel).toBeFalse();
            const model = resolveProvider(persona.providerRef, models);
            expect(model?.apiName).toBe("pib-cloud");
            expect(
                personalityAttention(
                    persona.providerRef,
                    models,
                    true,
                    persona.needsNewModel,
                ),
            ).toBeNull();
            expect(model).not.toBeNull();
            expect(isProviderOptionDisabled(model!, true)).toBeFalse();
            expect(CLOUD_TOKEN_API_NAME).toBe("pib-cloud");
            expect(
                providersForSelection(models, persona.providerRef, true).map(
                    (offered) => offered.apiName,
                ),
            ).toEqual([CLOUD_TOKEN_API_NAME]);
        }
    });

    it("maps each flat catalogue row onto one provider and one model", () => {
        expect(mockData.provider.length).toBe(mockData.assistantModel.length);
        expect(models.map((model) => model.id)).toEqual([7, 8, 9, 10]);
        expect(mockData.provider.map((provider) => provider.id)).toEqual([
            1, 2, 3, 4,
        ]);
        for (const provider of mockData.provider) {
            const owned = mockData.assistantModel.filter(
                (row) => row.providerId === provider.id,
            );
            expect(owned.length).toBe(1);
            expect(provider.capabilities).toEqual(
                capabilitiesHeldByAll(owned.map((row) => row.capabilities)),
            );
            expect(owned.every((row) => !("credentialRef" in row))).toBeTrue();
            expect(owned.every((row) => !("endpointBase" in row))).toBeTrue();
        }
        const cloud = models.find((model) => model.isDefault);
        expect(cloud?.providerName).toBe("pib.Cloud");
        expect(providerIdOf(cloud!)).toBe(4);
        expect(providerIdOf(cloud!)).not.toBe(cloud!.id);
        const account = mockData.provider.find(
            (provider) => provider.id === cloud!.providerId,
        );
        expect(account?.name).toBe("pib.Cloud");
        expect(account?.credentialRef).toBe("provider-10");
        expect(account?.endpointBase).toBeNull();
        const resolved = resolveProvider(DEFAULT_PROVIDER_REF, models);
        expect(resolved?.id).toBe(cloud!.id);
        expect(providerIdOf(resolved!)).toBe(account!.id);
    });
});
