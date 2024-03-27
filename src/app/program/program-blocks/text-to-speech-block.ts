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
                        ["Hannah (DE)", "HANNAH"],
                        ["Daniel (DE)", "DANIEL"],
                        ["Emma (EN)", "EMMA"],
                        ["Brian (EN)", "BRIAN"],
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
