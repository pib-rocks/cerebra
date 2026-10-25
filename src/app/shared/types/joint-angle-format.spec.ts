import {formatCentidegrees} from "./joint-angle-format";

describe("formatCentidegrees", () => {
    it("formats zero", () => {
        expect(formatCentidegrees(0)).toBe("0.0 °");
    });

    it("formats negative centidegrees", () => {
        expect(formatCentidegrees(-9000)).toBe("-90.0 °");
    });

    it("formats positive centidegrees with one decimal", () => {
        expect(formatCentidegrees(600)).toBe("6.0 °");
        expect(formatCentidegrees(4250)).toBe("42.5 °");
    });

    it("rounds to one decimal place", () => {
        expect(formatCentidegrees(1234)).toBe("12.3 °");
        expect(formatCentidegrees(1235)).toBe("12.4 °");
    });
});
