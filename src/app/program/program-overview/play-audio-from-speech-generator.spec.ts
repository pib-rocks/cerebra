/**
 * WHY THIS FILE LIVES HERE AND NOT BESIDE THE GENERATOR
 *
 * src/app/program/pib-blockly/ is mirrored from pib-backend by
 * sync-blockly-to-cerebra.yml (rsync -a --delete) and guard-blockly-single-source.yml rejects pull
 * requests that touch it. Anything that exists only in Cerebra inside that tree is therefore deleted
 * by the next sync - which is exactly what happened to this spec when PR-1964 synced the Blockly
 * fallback change.
 *
 * It cannot move to pib-backend either: it asserts the generator together with Cerebra's key-store
 * session, so it depends on Cerebra modules. So it sits one directory above the mirrored tree and
 * imports from it. Keep it here.
 */
import {Block} from "blockly/core/block";
import {Order, pythonGenerator} from "blockly/python";
import {TestBed} from "@angular/core/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {playAudioFromSpeechGenerator} from "../pib-blockly/program-generators/play-audio-from-speech-generator";
import {DEGRADED_MODE} from "src/app/system/keys/key-store-session";
import {KeyStoreSessionService} from "src/app/system/keys/key-store-session.service";

type MockGenerator = typeof pythonGenerator & {
    definitions_: Record<string, string>;
};

function createGenerator(values: Record<string, string>): MockGenerator {
    const generator = Object.create(pythonGenerator) as MockGenerator;
    generator.definitions_ = {};
    generator.provideFunction_ = (name: string, code: string | string[]) => {
        const declaration = Array.isArray(code) ? code.join("\n") : code;
        generator.definitions_[`function_${name}`] = declaration.replace(
            generator.FUNCTION_NAME_PLACEHOLDER_,
            name,
        );
        return name;
    };
    generator.valueToCode = (_block: Block, name: string, order: number) => {
        expect(order).toBe(Order.ATOMIC);
        return values[name] ?? '""';
    };
    return generator;
}

function blockWithFields(fields: Record<string, string>): Block {
    return {
        getFieldValue: (name: string) => fields[name] ?? null,
    } as unknown as Block;
}

describe("play audio from speech generator", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
    });

    it("keeps the local speech block working in degraded mode", () => {
        const session = TestBed.inject(KeyStoreSessionService);
        session.cancel();
        expect(session.mode).toBe(DEGRADED_MODE);
        expect(session.error).toBeNull();

        const generator = createGenerator({TEXT_INPUT: '"hello"'});
        const code = playAudioFromSpeechGenerator(
            blockWithFields({LANGUAGE: '"en"', VOICENAME: '"F1"'}),
            generator,
        );

        expect(code).toBe('play_audio_from_speech("hello", "F1", "en")\n');
        const declarations = Object.values(generator.definitions_).join("\n");
        expect(declarations).toContain("play_audio_from_speech_client");
        expect(declarations).toContain("'play_audio_from_speech'");
        expect(declarations).toContain("local Supertonic TTS");
        expect(declarations).not.toContain("key-store");
        expect(declarations).not.toContain("password");
    });
});
