import {centidegToRad, radToCentideg} from "./joint-angle-units";

describe("joint-angle-units", () => {
    describe("centidegToRad", () => {
        it("maps 0 to 0", () => {
            expect(centidegToRad(0)).toBe(0);
        });

        it("maps 9000 to pi/2", () => {
            expect(centidegToRad(9000)).toBe(Math.PI / 2);
        });

        it("maps -9000 to -pi/2", () => {
            expect(centidegToRad(-9000)).toBe(-Math.PI / 2);
        });
    });

    describe("radToCentideg", () => {
        it("maps 0 to 0", () => {
            expect(radToCentideg(0)).toBe(0);
        });

        it("maps pi/2 to 9000", () => {
            expect(radToCentideg(Math.PI / 2)).toBe(9000);
        });

        it("maps -pi/2 to -9000", () => {
            expect(radToCentideg(-Math.PI / 2)).toBe(-9000);
        });

        it("rounds to the nearest centidegree", () => {
            const justBelowHalf = (0.5 - Number.EPSILON) / (18000 / Math.PI);
            expect(radToCentideg(justBelowHalf)).toBe(0);
            const justAboveHalf = (0.5 + Number.EPSILON) / (18000 / Math.PI);
            expect(radToCentideg(justAboveHalf)).toBe(1);
        });
    });

    it("round-trips within one centidegree", () => {
        const samples = [-9000, -1, 0, 1, 4250, 9000, 12345];
        for (const centideg of samples) {
            const roundTrip = radToCentideg(centidegToRad(centideg));
            expect(Math.abs(roundTrip - centideg)).toBeLessThanOrEqual(1);
        }
    });
});
