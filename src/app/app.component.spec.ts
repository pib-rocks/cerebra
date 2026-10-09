import {TestBed, ComponentFixture} from "@angular/core/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {AppComponent} from "./app.component";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";
import {
    DEGRADED_MODE,
    PROMPT_MODE,
    STARTING_MODE,
    UNLOCKED_MODE,
} from "./system/keys/key-store-session";
import {routes} from "./app-routing.module";
import {VisibleStateService} from "./shared/services/visible-state.service";
import {visibleConversation} from "./shared/types/visible-state";
import {BehaviorSubject} from "rxjs";

describe("AppComponent", () => {
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
        const idle = visibleConversation({
            voiceTurnedOn: false,
            listening: false,
            assistantSpeaking: false,
            holderName: null,
            keyStoreDegraded: false,
            liveUnavailable: false,
        });
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                SmartConnectComponent,
                RelayControlComponent,
                IpRetrieverComponent,
                AppComponent,
            ],
            providers: [
                {
                    provide: VisibleStateService,
                    useValue: {
                        snapshot: idle,
                        snapshot$: new BehaviorSubject(idle),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
    });

    afterEach(() => {
        const http = TestBed.inject(HttpTestingController);
        for (const req of http.match("/api/system/key-store")) {
            req.flush({
                encryptKeyStorage: true,
                credentialRefs: [],
                mode: "degraded",
            });
        }
    });

    it("should create the app", () => {
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it("never opens the password dialog while the key store is cleartext", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        expect(app.session.mode).toBe(STARTING_MODE);
        expect(app.showStartupPassword()).toBeFalse();

        TestBed.inject(HttpTestingController)
            .expectOne("/api/system/key-store")
            .flush({
                encryptKeyStorage: false,
                credentialRefs: [],
                mode: "unlocked",
            });

        expect(app.session.mode).toBe(UNLOCKED_MODE);
        expect(app.showStartupPassword()).toBeFalse();
    });

    it("asks once the backend reports a locked store, and cancel enters degraded mode", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        // Nothing is asked before the backend has answered: asking first and
        // correcting afterwards would flash the dialog on a cleartext robot.
        expect(app.session.mode).toBe(STARTING_MODE);
        expect(app.showStartupPassword()).toBeFalse();

        TestBed.inject(HttpTestingController)
            .expectOne("/api/system/key-store")
            .flush({
                encryptKeyStorage: true,
                credentialRefs: [],
                mode: "degraded",
            });
        expect(app.session.mode).toBe(PROMPT_MODE);
        expect(app.showStartupPassword()).toBeTrue();

        app.session.cancel();

        expect(app.session.mode).toBe(DEGRADED_MODE);
        expect(app.session.error).toBeNull();
        expect(app.showStartupPassword()).toBeFalse();
    });

    it("shows who holds the voice in the header", () => {
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector("#voice-channel-holder")
                .textContent,
        ).toContain("Nobody holds the voice");
    });

    it("does not open the password dialog when the store is in cleartext", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        TestBed.inject(HttpTestingController)
            .expectOne("/api/system/key-store")
            .flush({
                encryptKeyStorage: false,
                credentialRefs: [],
                mode: "unlocked",
            });

        expect(app.session.mode).toBe(UNLOCKED_MODE);
        expect(app.showStartupPassword()).toBeFalse();
    });

    it("collapses and expands the sidebar with the handle on the divider, the arrow showing the way", () => {
        fixture.detectChanges();
        const wrapper: HTMLElement =
            fixture.nativeElement.querySelector(".wrapper");
        const handle: HTMLButtonElement = fixture.nativeElement.querySelector(
            "#sidebar-toggle-button",
        );
        const icon = handle.querySelector("i");
        expect(wrapper.classList.contains("sidebar-collapse")).toBeFalse();
        // Navigation open: the arrow points left, the way the click moves it.
        expect(icon?.classList.contains("bi-chevron-left")).toBeTrue();
        expect(icon?.classList.contains("bi-chevron-right")).toBeFalse();
        expect(handle.getAttribute("aria-expanded")).toBe("true");

        handle.click();
        fixture.detectChanges();
        expect(wrapper.classList.contains("sidebar-collapse")).toBeTrue();
        expect(icon?.classList.contains("bi-chevron-right")).toBeTrue();
        expect(icon?.classList.contains("bi-chevron-left")).toBeFalse();
        expect(handle.getAttribute("aria-expanded")).toBe("false");

        handle.click();
        fixture.detectChanges();
        expect(wrapper.classList.contains("sidebar-collapse")).toBeFalse();
        expect(icon?.classList.contains("bi-chevron-left")).toBeTrue();
    });

    it("keeps the old hamburger out of the header", () => {
        fixture.detectChanges();

        expect(
            fixture.nativeElement.querySelector("#hamburger-button"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector('[data-test="BTN_Hamburger"]'),
        ).toBeNull();
    });

    it("hides the startup modal on the display path", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        app.onDisplayPath = true;
        expect(app.showStartupPassword()).toBeFalse();
        expect(routes.some((route) => route.path === "display")).toBeTrue();
    });
});
