import {Block} from "blockly/core/block";
import {Order, pythonGenerator} from "blockly/python";

pythonGenerator.addReservedWords("lt_start_time,lt_start");

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

export function loop_timer(block: Block, generator: typeof pythonGenerator) {
    let code = "";
    (generator as any).definitions_["import_time"] = "import time";

    const loopTimer = generator.provideFunction_(
        "loopTimer",
        `
lt_start = False
lt_start_time = 0

def ${generator.FUNCTION_NAME_PLACEHOLDER_}(run_time = 10):
    global lt_start, lt_start_time
    if not lt_start:
        lt_start_time = time.time()
        actual_time = time.time()
        lt_start = True
    else:
        actual_time = time.time()
    if actual_time-lt_start_time > run_time:
        return False
    return True
`,
    );

    const loop_time = block.getFieldValue("LOOP_TIME");

    code += loopTimer + "(" + loop_time + ")";
    return [code, Order.ATOMIC];
}

export {pythonGenerator};
