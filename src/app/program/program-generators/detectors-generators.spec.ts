import {pythonGenerator} from "./custom-generators";

describe("pythonGenerator", () => {
    it("should insert face detection code when the setting is 'start' and nothing when it's 'stop'", () => {
        const block = jasmine.createSpyObj("block", ["getFieldValue"]);
        const forBlock = jasmine.createSpyObj("forBlock", [
            "face_detector_start_stop",
        ]);
        const generator = jasmine.createSpyObj(
            "generator",
            ["provideFunction_", "addReservedWords"],
            ["forBlock"],
        );
        generator.definitions_ = {};
        const className = "test-class-name";

        block.getFieldValue.and.returnValue("START");
        generator.provideFunction_.and.returnValue(className);
        forBlock.face_detector_start_stop.and.returnValue(className);

        const startCode = pythonGenerator.forBlock.face_detector_start_stop(
            block,
            generator,
        );
        expect(startCode).toContain(className);

        block.getFieldValue.and.returnValue("STOP");
        const stopCode = pythonGenerator.forBlock.face_detector_start_stop(
            block,
            generator,
        );
        expect(stopCode).not.toContain(className);

        expect(block.getFieldValue).toHaveBeenCalledWith("SETTING");
    });
});
