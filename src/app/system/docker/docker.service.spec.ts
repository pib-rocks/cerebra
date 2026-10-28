import {purgeOutcome} from "./docker.service";

describe("purgeOutcome", () => {
    it("uses the backend message that carries the freed size", () => {
        const outcome = purgeOutcome({
            status: "success",
            message: "Docker purge completed: 11.9 GB freed.",
            reclaimedHuman: "11.9 GB",
            errors: null,
        });

        expect(outcome.success).toBe("Docker purge completed: 11.9 GB freed.");
        expect(outcome.error).toBeNull();
    });

    it("falls back to the reclaimed size when the backend sends no message", () => {
        const outcome = purgeOutcome({
            status: "success",
            reclaimedHuman: "2.7 GB",
        });

        expect(outcome.success).toContain("2.7 GB");
    });

    it("names the steps that failed instead of looking like a success", () => {
        const outcome = purgeOutcome({
            status: "partial",
            message: "Docker purge completed: 1.0 GB freed. 1 step(s) failed.",
            reclaimedHuman: "1.0 GB",
            errors: ["images: 500"],
        });

        expect(outcome.success).toContain("1.0 GB");
        expect(outcome.error).toContain("images: 500");
    });
});
