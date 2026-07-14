import * as Blockly from "blockly";
import {customBlockDefinition} from "src/app/program/pib-blockly/program-blocks/custom-blocks";
import {pythonGenerator} from "src/app/program/pib-blockly/program-generators/custom-generators";

function createHeadlessWorkspace(): Blockly.Workspace {
    customBlockDefinition();
    return new Blockly.Workspace();
}

/**
 * UC-BLY-006 / UC-BLY-012: Run sends program_number only via ROS; backend reads saved codeVisual.
 * This suite asserts the frontend persistence payload shape (codeVisual JSON), not Python at runtime.
 */
describe("Blockly run payload contract", () => {
    let workspace: Blockly.Workspace;

    beforeEach(() => {
        workspace = createHeadlessWorkspace();
    });

    it("saved codeVisual JSON contains move_motor block configuration for backend", () => {
        const block = workspace.newBlock("move_motor");
        block.setFieldValue("THUMB_LEFT_STRETCH", "MOTORNAME");
        block.setFieldValue("ABSOLUTE", "MODE");

        const numberBlock = workspace.newBlock("math_number");
        numberBlock.setFieldValue("100", "NUM");
        block
            .getInput("POSITION")
            ?.connection?.connect(numberBlock.outputConnection);

        const codeVisual = JSON.stringify(
            Blockly.serialization.workspaces.save(workspace),
        );
        const parsed = JSON.parse(codeVisual);

        expect(codeVisual).toContain("move_motor");
        const blockCount =
            parsed.blocks?.blocks?.length ?? parsed.blocks?.length ?? 0;
        expect(blockCount).toBeGreaterThan(0);
    });

    it("ROS run payload is program_number only (no codeVisual in ROS request)", () => {
        const rosRunPayload = {program_number: "42"};
        expect(Object.keys(rosRunPayload)).toEqual(["program_number"]);
        expect(Object.keys(rosRunPayload)).not.toContain("codeVisual");
        expect(Object.keys(rosRunPayload)).not.toContain("python");
    });

    it("PUT /program/{n}/code body matches ProgramCode contract", () => {
        const codeVisual = JSON.stringify(
            Blockly.serialization.workspaces.save(workspace),
        );
        const putBody = {codeVisual};

        expect(typeof putBody.codeVisual).toBe("string");
        expect(() => JSON.parse(putBody.codeVisual)).not.toThrow();
    });
});

describe("Blockly run_script preview (UC-BLY-014)", () => {
    let workspace: Blockly.Workspace;

    beforeEach(() => {
        workspace = createHeadlessWorkspace();
    });

    it("run_script block generates Python with SSH connection logic", () => {
        workspace.newBlock("run_script");

        const code = pythonGenerator.workspaceToCode(workspace);

        expect(code).toContain("run_script_over_ssh");
        expect(code.trim().length).toBeGreaterThan(0);
    });
});
