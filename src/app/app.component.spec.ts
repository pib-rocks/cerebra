import {TestBed, ComponentFixture} from "@angular/core/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {AppComponent} from "./app.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";
import {DEGRADED_MODE, PROMPT_MODE} from "./system/speech/key-store-session";
import {routes} from "./app-routing.module";

describe("AppComponent", () => {
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                SmartConnectComponent,
                RelayControlComponent,
                IpRetrieverComponent,
                AppComponent,
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

    it("hides the startup modal on the display path", () => {
        const app = fixture.componentInstance;
        app.ngOnInit();
        app.onDisplayPath = true;
        expect(app.showStartupPassword()).toBeFalse();
        expect(routes.some((route) => route.path === "display")).toBeTrue();
    });
});
