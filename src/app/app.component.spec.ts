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
} from "./system/speech/key-store-session";
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

    it("opens and closes the sidebar with the hamburger button", () => {
        fixture.detectChanges();
        const wrapper: HTMLElement =
            fixture.nativeElement.querySelector(".wrapper");
        const hamburger: HTMLButtonElement =
            fixture.nativeElement.querySelector("#hamburger-button");
        expect(wrapper.classList.contains("sidebar-collapse")).toBeFalse();

        hamburger.click();
        fixture.detectChanges();
        expect(wrapper.classList.contains("sidebar-collapse")).toBeTrue();

        hamburger.click();
        fixture.detectChanges();
        expect(wrapper.classList.contains("sidebar-collapse")).toBeFalse();
    });

    it("hides the startup modal on the display path", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        app.onDisplayPath = true;
        expect(app.showStartupPassword()).toBeFalse();
        expect(routes.some((route) => route.path === "display")).toBeTrue();
    });
});
