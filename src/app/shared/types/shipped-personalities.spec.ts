import mockData from "../../../../server/json-server-database.json";
import {AssistantModel} from "./assistantModel";
import {VoiceAssistant} from "./voice-assistant";
import {
    CLOUD_TOKEN_API_NAME,
    DEFAULT_PROVIDER_REF,
    isProviderOptionDisabled,
    personalityAttention,
    providersForSelection,
    resolveProvider,
} from "./provider-registry";

const CATALOGUE = [
    {
        apiName: "hermes-agent",
        visualName: "Hermes Agent (selbstlernend)",
        isDefault: false,
    },
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
        AssistantModel.parseDtoToAssistantModel(row),
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
            expect(
                providersForSelection(models, persona.providerRef, true).map(
                    (offered) => offered.apiName,
                ),
            ).toEqual([CLOUD_TOKEN_API_NAME, "pib-cloud"]);
        }
    });
});
