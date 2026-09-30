import {ComponentFixture, TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {DisplayUnlockComponent} from "./display-unlock.component";
import {KeyStoreSessionService} from "./key-store-session.service";
import {DEGRADED_MODE, UNLOCKED_MODE} from "./key-store-session";
import {routes} from "src/app/app-routing.module";

describe("DisplayUnlockComponent", () => {
    let fixture: ComponentFixture<DisplayUnlockComponent>;
    let session: KeyStoreSessionService;
    let http: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, DisplayUnlockComponent],
        }).compileComponents();
        session = TestBed.inject(KeyStoreSessionService);
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(DisplayUnlockComponent);
        fixture.detectChanges();
    });

    afterEach(() => {
        http.verify();
    });

    it("is the display route", () => {
        const display = routes.find((route) => route.path === "display");
        expect(display).toBeDefined();
        expect(display?.loadComponent).toEqual(jasmine.any(Function));
    });

    it("reaches the password modal and can unlock the store", () => {
        expect(
            fixture.nativeElement.querySelector("#startup-password-input"),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector("#startup-password-ok"),
        ).not.toBeNull();
        expect(
            fixture.nativeElement.querySelector("#startup-password-cancel"),
        ).not.toBeNull();

        const input = fixture.nativeElement.querySelector(
            "#startup-password-input",
        ) as HTMLInputElement;
        input.value = "operator-secret";
        input.dispatchEvent(new Event("input"));
        fixture.nativeElement.querySelector("#startup-password-ok").click();

        const req = http.expectOne("/api/system/key-store/unlock");
        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual({password: "operator-secret"});
        req.flush({
            successful: true,
            credentials: [{credentialRef: "provider-4"}],
        });
        fixture.detectChanges();

        expect(session.mode).toBe(UNLOCKED_MODE);
        expect(session.error).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#display-key-store-unlocked")
                .textContent,
        ).toContain("The key store is unlocked.");
    });

    it("cancel on the display path enters degraded mode without an error", () => {
        fixture.nativeElement.querySelector("#startup-password-cancel").click();
        fixture.detectChanges();

        expect(session.mode).toBe(DEGRADED_MODE);
        expect(session.error).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#startup-password-error"),
        ).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#display-degraded-mode")
                .textContent,
        ).toContain("Degraded mode");
        expect(
            fixture.nativeElement.querySelector("#startup-password-ok"),
        ).not.toBeNull();
    });
});
