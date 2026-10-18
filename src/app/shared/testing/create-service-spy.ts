/**
 * Builds a service double for a spec in one supported way.
 *
 * Why this exists (PC-64 / PC-72): `jasmine.createSpyObj(name, methods,
 * properties)` is the wrong tool for a property that carries a live stream.
 * The third argument does not store the value - jasmine defines a getter and a
 * setter for it, and both are spies. `.next(...)` still reaches subscribers
 * through the getter, but `spy.someSubject = new BehaviorSubject(...)` calls
 * the setter spy, which throws the value away. The spec then keeps passing
 * while it asserts nothing, which is how PC-63 produced two failing specs
 * surrounded by green ones that never checked their data.
 *
 * This helper attaches the values as ordinary writable fields instead, so:
 *  - the subject you pass is the subject the component subscribes to, and
 *  - a later assignment behaves like a normal field (it does not vanish).
 *
 * Publish test data with `.next(...)` on the subject you passed in, never by
 * replacing the property.
 *
 * @example
 * const service = createServiceSpy<VoiceAssistantService>(
 *     "VoiceAssistantService",
 *     ["getPersonality", "getSubject"],
 *     {assistantModelsSubject: models},
 * );
 * models.next([cloudModel]);
 */

/**
 * @param baseName Name jasmine uses to label the spies in failure output.
 * @param methods The service methods to spy on - typed, so
 *        `spy.getPersonality.and.returnValue(...)` still type-checks.
 * @param properties Values handed to the double as plain writable fields.
 *        The values are deliberately not type-checked against the service:
 *        specs stub partial shapes (a `BehaviorSubject` where the service
 *        declares a bare `Subject`, an empty array for a populated list) and
 *        forcing the exact service type would reject those legitimate stubs.
 */
export function createServiceSpy<T>(
    baseName: string,
    methods: readonly (keyof T)[],
    properties: Partial<Record<keyof T, unknown>> = {},
): jasmine.SpyObj<T> {
    // SpyObjMethodNames<T> is a conditional type, so TypeScript cannot match the
    // generic parameter list against that overload without help. The caller still
    // gets keyof-typing at the call site; the cast only picks the overload.
    const spy = jasmine.createSpyObj<T>(
        baseName,
        methods as jasmine.SpyObjMethodNames<T>,
    );

    for (const [name, value] of Object.entries(properties)) {
        Object.defineProperty(spy, name, {
            value,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    }

    return spy;
}
