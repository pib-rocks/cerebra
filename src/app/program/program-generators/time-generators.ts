import {Block} from "blockly/core/block";
import {Order, pythonGenerator} from "blockly/python";

pythonGenerator.addReservedWords("time");

export function sleep_for_seconds(
    block: Block,
    generator: typeof pythonGenerator,
) {
    let code = "";
    (generator as any).definitions_["import_time"] = "import time";

    const sleep_time = block.getFieldValue("SECONDS");
    code = `time.sleep(${sleep_time})\n`;

    return code;
}

export function get_system_time(
    block: Block,
    generator: typeof pythonGenerator,
) {
    let code = "";
    (generator as any).definitions_["import_time"] = "import time";

    code += "round(time.time() * 1000)";
    return [code, Order.ATOMIC];
}

export {pythonGenerator};
