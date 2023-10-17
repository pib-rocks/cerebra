import {BoolToOnOffPipe} from "./bool-to-on-off-pipe.pipe";

describe("BoolToOnOffPipePipe", () => {
    it("create an instance", () => {
        const pipe = new BoolToOnOffPipe();
        expect(pipe).toBeTruthy();
    });
});
