import {joints} from "./joint-configuration";

describe("joint configuration", () => {
    it("points every tab background at an asset that ships with the app", () => {
        // The tabs were blank after the move from /joint-control to /movement: the config kept
        // pointing at /joint-control/background/*.png while the files moved to assets/movement.
        for (const joint of joints) {
            expect(joint.background)
                .withContext(joint.label)
                .toMatch(/^\/movement\/background\/[a-z_]+\.png$/);
        }
    });

    it("lists a background for all five tabs", () => {
        expect(joints.map((joint) => joint.jointPathName)).toEqual([
            "head",
            "left-hand",
            "right-hand",
            "left-arm",
            "right-arm",
        ]);
    });
});
