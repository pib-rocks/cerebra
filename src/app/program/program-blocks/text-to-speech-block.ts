import * as Blockly from "blockly";

export const textToSpeechBlock =
    Blockly.common.createBlockDefinitionsFromJsonArray([
        {
            type: "text_to_speech",
            message0: "as  %1 say %2",
            args0: [
                {
                    type: "field_dropdown",
                    name: "VOICENAME",
                    options: [
                        ["Hannah (DE)", '"Hannah"'],
                        ["Daniel (DE)", '"Daniel"'],
                        ["Emma (EN)", '"Emma"'],
                        ["Brian (EN)", '"Brian"'],
                    ],
                },
                {
                    type: "input_value",
                    name: "TEXT_INPUT",
                    check: "String",
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 112,
            tooltip: "",
            helpUrl: "",
        },
    ]);
