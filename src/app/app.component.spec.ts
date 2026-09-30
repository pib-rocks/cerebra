import {TestBed, ComponentFixture} from "@angular/core/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {AppComponent} from "./app.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";
import {DEGRADED_MODE, PROMPT_MODE} from "./system/speech/key-store-session";
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

    it("should create the app", () => {
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it("opens on the password prompt and cancel enters degraded mode", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
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

    it("hides the startup modal on the display path", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        app.onDisplayPath = true;
        expect(app.showStartupPassword()).toBeFalse();
        expect(routes.some((route) => route.path === "display")).toBeTrue();
    });
});
