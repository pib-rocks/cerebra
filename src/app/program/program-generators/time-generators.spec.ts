import {pythonGenerator} from "blockly/python";

describe("pythonGenerator", () => {
    it("should build the time code string accordingly", () => {
        const block = jasmine.createSpyObj("block", ["getFieldValue"]);

        const generator = jasmine.createSpyObj("generator", ["forBlock"]);

        generator.definitions_ = {};
        block.getFieldValue.and.returnValue("time test value");

        const code = pythonGenerator.forBlock.sleep_for_seconds(
            block,
            generator,
        );
        expect(code).toContain("time test value");

        expect(block.getFieldValue).toHaveBeenCalledWith("SECONDS");
    });

    it("should generate code to get the system time", () => {
        const block = jasmine.createSpyObj("block", ["getFieldValue"]);
        const generator = jasmine.createSpyObj("generator", ["forBlock"]);

        generator.definitions_ = {};

        const code = pythonGenerator.forBlock.get_system_time(block, generator);
        expect(code).toContain("round(time.time() * 1000)");
    });
});
