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

    // The test target serves src/assets, so this asks for exactly the file the template asks for.
    // A renamed folder answers 404 here instead of showing up as a blank tab.
    for (const joint of joints) {
        it(`serves the ${joint.label} background`, async () => {
            const url = `/assets${joint.background}`;
            const response = await fetch(url);

            expect(response.ok)
                .withContext(`${url} -> ${response.status}`)
                .toBeTrue();
            const blob = await response.blob();
            expect(blob.type).withContext(url).toContain("image");
            expect(blob.size).withContext(url).toBeGreaterThan(0);
        });
    }

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
