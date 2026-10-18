import {BehaviorSubject} from "rxjs";
import {createServiceSpy} from "./create-service-spy";

interface SampleService {
    getThing(): string;
    subscribeToThing(onNext: (value: string) => void): void;
    thingSubject: BehaviorSubject<string[]>;
}

describe("createServiceSpy", () => {
    it("spies on every method it is given", () => {
        const spy = createServiceSpy<SampleService>(
            "SampleService",
            ["getThing", "subscribeToThing"],
            {thingSubject: new BehaviorSubject<string[]>([])},
        );

        spy.getThing.and.returnValue("answer");

        expect(spy.getThing()).toBe("answer");
        expect(spy.subscribeToThing).toBeDefined();
        expect(spy.getThing).toHaveBeenCalled();
    });

    it("works without a properties argument", () => {
        const spy = createServiceSpy<SampleService>("SampleService", [
            "getThing",
        ]);

        spy.getThing.and.returnValue("answer");

        expect(spy.getThing()).toBe("answer");
        expect(spy.thingSubject).toBeUndefined();
    });

    it("builds a double that only carries fields, without any methods", () => {
        // jasmine.createSpyObj refuses a spy object with neither methods nor
        // propertyNames; ChatService's chatSubject double is exactly that shape.
        const spy = createServiceSpy<SampleService>("SampleService", [], {
            thingSubject: new BehaviorSubject<string[]>(["only-field"]),
        });

        expect(spy.thingSubject.getValue()).toEqual(["only-field"]);
    });

    it("hands the declared subject to the double as a real subject that publishes", () => {
        const seen: string[][] = [];
        const spy = createServiceSpy<SampleService>(
            "SampleService",
            ["getThing"],
            {thingSubject: new BehaviorSubject<string[]>([])},
        );

        spy.thingSubject.subscribe((value: string[]) => seen.push(value));
        spy.thingSubject.next(["first"]);
        spy.thingSubject.next(["second"]);

        expect(seen).toEqual([[], ["first"], ["second"]]);
    });

    it("keeps the declared property writable, so a later assignment is not swallowed", () => {
        const spy = createServiceSpy<SampleService>(
            "SampleService",
            ["getThing"],
            {thingSubject: new BehaviorSubject<string[]>([])},
        );
        const replacement = new BehaviorSubject<string[]>(["replaced"]);

        // The lint rule is file-scoped and cannot tell which object came from
        // the helper, so it is disabled where this spec deliberately assigns.
        // eslint-disable-next-line local/no-spy-subject-assignment -- proves the helper leaves the property writable
        spy.thingSubject = replacement;

        expect(spy.thingSubject).toBe(replacement);
        expect(spy.thingSubject.getValue()).toEqual(["replaced"]);
    });

    it("documents the jasmine behaviour this helper exists to avoid", () => {
        // The third createSpyObj argument turns the property into a
        // getter/setter pair of spies: the setter swallows the value and the
        // spec keeps passing while asserting nothing (PC-63, PC-64).
        const original = new BehaviorSubject<string[]>([]);
        // eslint-disable-next-line local/no-three-arg-create-spy-obj -- this spec exists to pin down the behaviour the rule forbids
        const plainJasmine = jasmine.createSpyObj<SampleService>(
            "plainJasmine",
            ["getThing"],
            {thingSubject: original},
        );
        const replacement = new BehaviorSubject<string[]>(["replaced"]);

        // eslint-disable-next-line local/no-spy-subject-assignment -- this spec documents the swallowed assignment on purpose
        plainJasmine.thingSubject = replacement;

        expect(plainJasmine.thingSubject).toBe(original);
        expect(plainJasmine.thingSubject.getValue()).toEqual([]);
    });
});
