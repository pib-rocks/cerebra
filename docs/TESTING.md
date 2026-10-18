# Testing notes

The unit suite runs with Karma + Jasmine (`npm test`, CI job "Cerebra CI-Pipeline").

## Service doubles: use `createServiceSpy`

A spec that needs a service double must build it with `createServiceSpy`
(`src/app/shared/testing/create-service-spy.ts`). It is the only supported way to
give a double a subject.

```ts
import {createServiceSpy} from "src/app/shared/testing/create-service-spy";

const models = new BehaviorSubject<AssistantModel[]>([]);
const service = createServiceSpy<VoiceAssistantService>(
    "VoiceAssistantService",
    ["getPersonality", "getSubject"],
    {assistantModelsSubject: models},
);

// data reaches the component through the subject it subscribes to:
models.next([cloudModel]);
```

Why not `jasmine.createSpyObj(name, methods, properties)` directly: the third
argument does not store the values. Jasmine defines a getter and a setter per
property, and both are spies - the setter accepts whatever you assign and throws
it away. A spec that declares `{modelsSubject: ...}` and later does
`service.modelsSubject = new BehaviorSubject([...])` therefore keeps the old
subject and keeps passing while it asserts nothing (PC-63). `createServiceSpy`
attaches the values as ordinary writable fields, so the subject you pass is the
subject the component subscribes to, and a later assignment behaves like a normal
field instead of vanishing.

Two consequences worth remembering:

-   Never populate a spy subject by assigning a new one. Call `.next(...)` on the
    subject you handed to the double.
-   `jasmine.createSpyObj(name, methods, properties)` with a third argument is
    banned in specs (`local/no-three-arg-create-spy-obj`). Use the helper
    instead; there is one intentional exception, the helper's own spec, which
    pins down the behaviour the rule forbids.
-   The lint rule `local/no-spy-subject-assignment` (config in `eslint.config.js`,
    rule in `eslint-rules/`) fails the build when a spec assigns to a property the
    same file declared on a spy. Assigning to a subject on a real service instance
    is fine and is not flagged - `chat.service.spec.ts` does it deliberately.
