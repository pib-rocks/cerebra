import * as Blockly from "blockly";

export const time_blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
    {
        type: "sleep_for_seconds",
        message0: "Sleep for  %1 seconds",
        args0: [
            {
                type: "field_number",
                name: "SECONDS",
                value: 0.1,
                min: 0.001,
                max: 10,
                precision: 0.001,
            },
        ],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: 130,
        tooltip:
            "Sleeps for specified time. Accepts numbers with a maximum of three decimal places",
        helpUrl: "",
    },
    {
        type: "loop_timer",
        message0: "Loop time of %1 seconds",
        args0: [
            {
                type: "field_number",
                name: "LOOP_TIME",
                value: 10,
                min: 1,
                max: 600,
                precision: 1,
            },
        ],
        output: "Boolean",
        colour: 130,
        tooltip: "Breaks out of the loop after specified time",
        helpUrl: "",
    },
]);
