import {AssistantModel} from "./assistantModel";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    IMAGES_NEED_MCP,
    IMAGES_NEED_TOOL_CALLING,
    IMAGES_NEED_TOOL_CALLING_AND_MCP,
    LOCAL_VOICE_INPUT,
    LOCAL_VOICE_OUTPUT,
    NEW_PERSONALITY_REASONING_EFFORT,
    TOOLS_NO_CAPABILITY,
    enforcePersonalityDialog,
    imageSwitchAvailability,
    liveFromChosenModel,
    readPersonalityDialog,
    reasoningEffortFromStored,
    toolCallingAvailability,
    voiceInputOptions,
    voiceOutputOptions,
} from "./personality-dialog";
import {ProviderCapabilities} from "./provider-registry";

function flags(partial: Partial<ProviderCapabilities>): ProviderCapabilities {
    return {
        tools: false,
        images: true,
        live: false,
        stt: false,
        tts: false,
        ...partial,
    };
}

describe("personality dialog rules", () => {
    it("starts from Smart-dialog defaults when a personality has no extra fields", () => {
        expect(readPersonalityDialog(undefined)).toEqual({
            voiceInput: LOCAL_VOICE_INPUT,
            voiceOutput: LOCAL_VOICE_OUTPUT,
            toolCalling: true,
            images: false,
            live: false,
            idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
            mcp: true,
            reasoningEffort: null,
        });
    });

    it("keeps a stored reasoning level and does not read NULL as none", () => {
        expect(NEW_PERSONALITY_REASONING_EFFORT).toBe("none");
        expect(readPersonalityDialog(undefined).reasoningEffort).toBeNull();
        expect(
            readPersonalityDialog({reasoningEffort: null}).reasoningEffort,
        ).toBeNull();
        expect(reasoningEffortFromStored("")).toBeNull();
        expect(reasoningEffortFromStored("nope")).toBeNull();
        expect(
            readPersonalityDialog({reasoningEffort: "high"}).reasoningEffort,
        ).toBe("high");
        expect(
            readPersonalityDialog({reasoningEffort: "none"}).reasoningEffort,
        ).toBe("none");
        expect(
            enforcePersonalityDialog(
                readPersonalityDialog({reasoningEffort: null}),
                null,
                false,
            ).reasoningEffort,
        ).toBeNull();
    });

    it("greys out images while tool calling or the MCP server is off", () => {
        expect(imageSwitchAvailability(true, true)).toEqual({
            disabled: false,
            reason: null,
        });
        expect(imageSwitchAvailability(false, true)).toEqual({
            disabled: true,
            reason: IMAGES_NEED_TOOL_CALLING,
        });
        expect(imageSwitchAvailability(true, false)).toEqual({
            disabled: true,
            reason: IMAGES_NEED_MCP,
        });
        expect(imageSwitchAvailability(false, false)).toEqual({
            disabled: true,
            reason: IMAGES_NEED_TOOL_CALLING_AND_MCP,
        });
    });

    it("derives live from the chosen model and does not keep a separate mode", () => {
        const live = new AssistantModel(
            1,
            "gemini-3.8-live",
            "Gemini 3.8 Live",
            true,
            null,
            flags({tools: true, live: true}),
            "provider-1",
            false,
        );
        const plain = new AssistantModel(
            2,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            null,
            flags({tools: true, live: false}),
            "provider-1",
            false,
        );
        expect(liveFromChosenModel(live, true, false)).toBeTrue();
        expect(liveFromChosenModel(plain, true, true)).toBeFalse();
        expect(liveFromChosenModel(null, false, true)).toBeTrue();
        expect(
            enforcePersonalityDialog(
                readPersonalityDialog({live: false}),
                live,
                true,
            ).live,
        ).toBeTrue();
        expect(
            enforcePersonalityDialog(
                readPersonalityDialog({live: true}),
                plain,
                true,
            ).live,
        ).toBeFalse();
    });

    it("forces tool calling off when the provider cannot call tools", () => {
        const noTools = new AssistantModel(
            3,
            "legacy",
            "Legacy",
            true,
            null,
            flags({tools: false}),
            "provider-3",
            false,
        );
        expect(toolCallingAvailability(noTools, true)).toEqual({
            disabled: true,
            reason: TOOLS_NO_CAPABILITY,
        });
        const saved = enforcePersonalityDialog(
            readPersonalityDialog({toolCalling: true, images: true, mcp: true}),
            noTools,
            true,
        );
        expect(saved.toolCalling).toBeFalse();
        expect(saved.images).toBeFalse();
    });

    it("offers local speech engines and only voice rows that have a stored key", () => {
        const keyed = new AssistantModel(
            4,
            "openai",
            "OpenAI",
            true,
            null,
            flags({stt: true, tts: true, tools: true}),
            "provider-4",
            false,
        );
        const missing = new AssistantModel(
            5,
            "gemini",
            "Gemini",
            true,
            null,
            flags({stt: true, tts: true, tools: true}),
            null,
            false,
        );
        expect(
            voiceInputOptions([keyed, missing], false).map(
                (option) => option.id,
            ),
        ).toEqual([LOCAL_VOICE_INPUT, "4"]);
        expect(
            voiceOutputOptions([keyed, missing], false).map(
                (option) => option.id,
            ),
        ).toEqual([LOCAL_VOICE_OUTPUT, "4"]);
    });

    it("offers every speech model of a provider from that provider's one key", () => {
        const flash = new AssistantModel(
            7,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            null,
            flags({stt: true, tts: true, tools: true}),
            null,
            false,
            false,
            1,
            "Google",
        );
        const live = new AssistantModel(
            11,
            "gemini-3.8-live",
            "Gemini 3.8 Live",
            false,
            null,
            flags({stt: true, tts: true, tools: true, images: false}),
            "provider-1",
            false,
            false,
            1,
            "Google",
        );
        const gpt = new AssistantModel(
            8,
            "gpt-6",
            "GPT-6",
            true,
            null,
            flags({stt: true, tts: true, tools: true}),
            null,
            false,
            false,
            2,
            "OpenAI",
        );
        expect(
            voiceInputOptions([flash, live, gpt], false).map(
                (option) => option.id,
            ),
        ).toEqual([LOCAL_VOICE_INPUT, "7", "11"]);
        expect(
            voiceOutputOptions([flash, live, gpt], false).map(
                (option) => option.id,
            ),
        ).toEqual([LOCAL_VOICE_OUTPUT, "7", "11"]);
    });

    it("does not offer a retired model as a voice engine", () => {
        const retired = new AssistantModel(
            8,
            "gpt-6",
            "GPT-6",
            true,
            null,
            flags({stt: true, tts: true, tools: true}),
            "provider-8",
            false,
            true,
        );
        expect(
            voiceInputOptions([retired], false).map((option) => option.id),
        ).toEqual([LOCAL_VOICE_INPUT]);
        expect(
            voiceOutputOptions([retired], false).map((option) => option.id),
        ).toEqual([LOCAL_VOICE_OUTPUT]);
        expect(
            voiceInputOptions([retired], false).map((option) => option.label),
        ).not.toContain(retired.visualName);
        expect(
            voiceOutputOptions([retired], false).map((option) => option.label),
        ).not.toContain(retired.visualName);
    });
});
