import {Component} from "@angular/core";
import {TestBed} from "@angular/core/testing";
import {
    ActivatedRouteSnapshot,
    Route,
    Router,
    RouterOutlet,
    provideRouter,
} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";
import {routes} from "src/app/app-routing.module";

@Component({
    selector: "app-route-stub",
    template: "<router-outlet></router-outlet>",
    imports: [RouterOutlet],
})
class RouteStubComponent {}

const PERSONALITY = "01234567-0123-0123-0123-0123456789ab";
const CHAT = "89abcdef-0123-0123-0123-0123456789ab";

/** The real route tree, with stubs in place of lazy components and resolvers. */
function stubbed(route: Route): Route {
    const {
        loadComponent,
        component,
        resolve: _resolve,
        children,
        ...rest
    } = route;
    const copy: Route = {...rest};
    if (loadComponent != null || component != null) {
        copy.component = RouteStubComponent;
    }
    if (children != null) {
        copy.children = children.map(stubbed);
    }
    return copy;
}

function voiceAssistantRoute(): Route {
    const route = routes.find((item) => item.path === "voice-assistant");
    expect(route).toBeDefined();
    return route as Route;
}

function personalityRoute(): Route {
    const route = voiceAssistantRoute().children?.find(
        (item) => item.path === ":personalityUuid",
    );
    expect(route).toBeDefined();
    return route as Route;
}

function leaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = snapshot;
    while (current.firstChild != null) {
        current = current.firstChild;
    }
    return current;
}

describe("voice assistant routes", () => {
    let harness: RouterTestingHarness;
    let router: Router;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [provideRouter([stubbed(voiceAssistantRoute())])],
        });
        harness = await RouterTestingHarness.create();
        router = TestBed.inject(Router);
    });

    it("redirects a bare personality URL to that personality's chat", async () => {
        await harness.navigateByUrl(`/voice-assistant/${PERSONALITY}`);

        expect(router.url).toBe(`/voice-assistant/${PERSONALITY}/chat`);
        const active = leaf(router.routerState.snapshot.root);
        expect(active.parent?.routeConfig?.path).toBe("chat");
        expect(active.parent?.parent?.params["personalityUuid"]).toBe(
            PERSONALITY,
        );
    });

    it("leaves chat and chat-entry URLs as they are", async () => {
        await harness.navigateByUrl(`/voice-assistant/${PERSONALITY}/chat`);
        expect(router.url).toBe(`/voice-assistant/${PERSONALITY}/chat`);

        await harness.navigateByUrl(
            `/voice-assistant/${PERSONALITY}/chat/${CHAT}`,
        );
        expect(router.url).toBe(`/voice-assistant/${PERSONALITY}/chat/${CHAT}`);
        expect(leaf(router.routerState.snapshot.root).params["chatUuid"]).toBe(
            CHAT,
        );
    });

    it("no longer routes to the full-page identity view", () => {
        const empty = personalityRoute().children?.find(
            (item) => item.path === "",
        );
        expect(empty).toEqual({
            path: "",
            redirectTo: "chat",
            pathMatch: "full",
        });
        expect(personalityRoute().children?.map((item) => item.path)).toEqual([
            "",
            "chat",
        ]);
    });
});
