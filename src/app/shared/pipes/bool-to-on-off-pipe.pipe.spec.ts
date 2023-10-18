import {BoolToOnOffPipe} from "./bool-to-on-off-pipe.pipe";

describe("BoolToOnOffPipePipe", () => {
    it("create an instance", () => {
        const pipe = new BoolToOnOffPipe();
        expect(pipe).toBeTruthy();
    });

    it("should transform false to OFF", () => {
        const pipe = new BoolToOnOffPipe();
        expect(pipe.transform(false)).toBe("OFF");
    });

    it("should transform true to ON", () => {
        const pipe = new BoolToOnOffPipe();
        expect(pipe.transform(true)).toBe("ON");
    });
});
