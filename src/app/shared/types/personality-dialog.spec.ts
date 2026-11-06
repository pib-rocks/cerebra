import {AssistantModel} from "./assistantModel";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    LOCAL_VOICE_INPUT,
    LOCAL_VOICE_OUTPUT,
    NEW_PERSONALITY_REASONING_EFFORT,
    REASONING_NO_CAPABILITY,
    TOOLS_NO_CAPABILITY,
    enforcePersonalityDialog,
    liveFromChosenModel,
    readPersonalityDialog,
    reasoningAvailability,
    reasoningEffortFromStored,
    toolCallingAvailability,
    voiceInputOptions,
    voiceOutputOptions,
    reconcileVoiceSelection,
    chatModelOptions,
} from "./personality-dialog";
import {
    CLOUD_TOKEN_API_NAME,
    PIB_CLOUD_NATURAL_CHAT_LABEL,
    ProviderCapabilities,
} from "./provider-registry";

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
            reasoningEffort: null,
            useWakeWord: false,
            wakeUpProgram: null,
            goSleepProgram: null,
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

    it("greys reasoning out only when the chosen row reports it cannot reason", () => {
        const cannotReason = new AssistantModel(
            6,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({tools: true, reasoning: false}),
            "provider-6",
            false,
        );
        const silent = new AssistantModel(
            7,
            "gpt-6",
            "GPT-6",
            true,
            null,
            flags({tools: true}),
            "provider-7",
            false,
        );
        expect(reasoningAvailability(cannotReason, true)).toEqual({
            disabled: true,
            reason: REASONING_NO_CAPABILITY,
        });
        // A missing flag means the model can reason, not that it cannot.
        expect(reasoningAvailability(silent, true)).toEqual({
            disabled: false,
            reason: null,
        });
        expect(reasoningAvailability(cannotReason, false)).toEqual({
            disabled: false,
            reason: null,
        });
        expect(reasoningAvailability(null, true)).toEqual({
            disabled: false,
            reason: null,
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
            readPersonalityDialog({toolCalling: true, images: true}),
            noTools,
            true,
        );
        expect(saved.toolCalling).toBeFalse();
        // images is no longer a dialog control: a stored value survives.
        expect(saved.images).toBeTrue();
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

    it("keeps cloud speech rows visible on a persisted credential while the token probe reloads", () => {
        const cloud = new AssistantModel(
            5,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({stt: true, tts: true, tools: true, images: true}),
            "provider-4",
            false,
        );
        expect(
            voiceInputOptions([cloud], false, "loading").map(
                (option) => option.id,
            ),
        ).toEqual(["5", LOCAL_VOICE_INPUT]);
        expect(
            voiceOutputOptions([cloud], false, "unavailable").map(
                (option) => option.id,
            ),
        ).toEqual(["5", LOCAL_VOICE_OUTPUT]);
    });

    it("offers pib.Cloud before the local engine and the other providers", () => {
        const cloud = new AssistantModel(
            5,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({stt: true, tts: true, tools: true, reasoning: false}),
            "provider-4",
            false,
        );
        const other = new AssistantModel(
            6,
            "openai",
            "OpenAI",
            true,
            null,
            flags({stt: true, tts: true, tools: true}),
            "provider-6",
            false,
        );
        expect(
            voiceInputOptions([other, cloud], false).map((option) => option.id),
        ).toEqual(["5", LOCAL_VOICE_INPUT, "6"]);
        expect(
            voiceOutputOptions([other, cloud], false).map(
                (option) => option.id,
            ),
        ).toEqual(["5", LOCAL_VOICE_OUTPUT, "6"]);
    });

    it("does not silently fall back to local speech while the token probe is unfinished", () => {
        const cloud = new AssistantModel(
            5,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({stt: true, tts: true, tools: true, images: true}),
            null,
            false,
        );
        const options = voiceInputOptions([cloud], true, "loading");
        expect(options.map((option) => option.id)).toEqual([LOCAL_VOICE_INPUT]);
        expect(
            reconcileVoiceSelection("5", options, LOCAL_VOICE_INPUT, "loading"),
        ).toBe("5");
        expect(
            reconcileVoiceSelection(
                "5",
                voiceInputOptions([cloud], false, "available"),
                LOCAL_VOICE_INPUT,
                "available",
            ),
        ).toBe(LOCAL_VOICE_INPUT);
    });

    it("maps stored backend engine ids cloud_whisper, cloud_tts and local_whisper onto the dialog option values", () => {
        const cloud = new AssistantModel(
            5,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({stt: true, tts: true, tools: true, images: true}),
            "provider-4",
            true,
        );
        const flash = new AssistantModel(
            1,
            "gemini-3.8-flash",
            "Gemini 3.8 Flash",
            true,
            null,
            flags({stt: false, tts: false, tools: true, images: true}),
            "provider-1",
            false,
        );
        const models = [flash, cloud];
        const inOpts = voiceInputOptions(models, true, "available");
        const outOpts = voiceOutputOptions(models, true, "available");

        expect(
            reconcileVoiceSelection(
                "cloud_whisper",
                inOpts,
                LOCAL_VOICE_INPUT,
                "available",
                models,
            ),
        ).toBe("5");
        expect(
            reconcileVoiceSelection(
                "cloud_tts",
                outOpts,
                LOCAL_VOICE_OUTPUT,
                "available",
                models,
            ),
        ).toBe("5");
        expect(
            reconcileVoiceSelection(
                "local_whisper",
                inOpts,
                LOCAL_VOICE_INPUT,
                "available",
                models,
            ),
        ).toBe(LOCAL_VOICE_INPUT);
        expect(
            readPersonalityDialog({voiceInput: "local_whisper"}).voiceInput,
        ).toBe(LOCAL_VOICE_INPUT);
    });

    it("shows one Natural Chat model option with pib.Cloud only when the cloud token is stored", () => {
        const textCloud = new AssistantModel(
            10,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({tools: true, live: false}),
            null,
            true,
            false,
            4,
            "pib.Cloud",
        );
        const liveCloud = new AssistantModel(
            11,
            "gemini-3.8-live",
            "Gemini 3.8 Live",
            false,
            null,
            flags({tools: true, live: true, images: false}),
            null,
            false,
            false,
            4,
            "pib.Cloud",
        );
        const catalogue = [textCloud, liveCloud];
        const offered = [textCloud, liveCloud];
        expect(
            chatModelOptions(offered, catalogue, true).map(
                (model) => model.visualName,
            ),
        ).toEqual(["pib.Cloud", PIB_CLOUD_NATURAL_CHAT_LABEL]);
        expect(
            chatModelOptions(offered, catalogue, false).map(
                (model) => model.visualName,
            ),
        ).toEqual(["pib.Cloud"]);
        expect(
            chatModelOptions(offered, catalogue, true).map(
                (model) => model.visualName,
            ),
        ).not.toContain("Gemini 3.8 Live");
    });

    it("enforces pib.Cloud for both voiceInput and voiceOutput when a live model is chosen", () => {
        const textCloud = new AssistantModel(
            10,
            CLOUD_TOKEN_API_NAME,
            "pib.Cloud",
            true,
            null,
            flags({tools: true, live: false, stt: true, tts: true}),
            null,
            true,
        );
        const liveCloud = new AssistantModel(
            11,
            "gemini-3.8-live",
            "Gemini 3.8 Live",
            false,
            null,
            flags({tools: true, live: true, images: false}),
            null,
            false,
        );
        const enforced = enforcePersonalityDialog(
            readPersonalityDialog({
                voiceInput: LOCAL_VOICE_INPUT,
                voiceOutput: LOCAL_VOICE_OUTPUT,
            }),
            liveCloud,
            true,
            [textCloud, liveCloud],
        );
        expect(enforced.live).toBeTrue();
        expect(enforced.voiceInput).toBe("10");
        expect(enforced.voiceOutput).toBe("10");
    });
});
