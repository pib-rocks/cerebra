import {AssistantModel} from "./assistantModel";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    IMAGES_NEED_MCP,
    IMAGES_NEED_TOOL_CALLING,
    IMAGES_NEED_TOOL_CALLING_AND_MCP,
    LIVE_NO_CAPABILITY,
    LOCAL_VOICE_INPUT,
    LOCAL_VOICE_OUTPUT,
    TOOLS_NO_CAPABILITY,
    enforcePersonalityDialog,
    imageSwitchAvailability,
    liveSwitchAvailability,
    readPersonalityDialog,
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
        });
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

    it("greys out live only when the resolved provider has no live capability", () => {
        const live = new AssistantModel(
            1,
            "gemini",
            "Gemini",
            true,
            null,
            flags({tools: true, live: true}),
            "provider-1",
            true,
        );
        const plain = new AssistantModel(
            2,
            "anthropic",
            "Claude",
            true,
            null,
            flags({tools: true, live: false}),
            "provider-2",
            false,
        );
        expect(liveSwitchAvailability(live, true)).toEqual({
            disabled: false,
            reason: null,
        });
        expect(liveSwitchAvailability(plain, true)).toEqual({
            disabled: true,
            reason: LIVE_NO_CAPABILITY,
        });
        expect(liveSwitchAvailability(null, false).disabled).toBeFalse();
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
});
