import {ComponentFixture, TestBed} from "@angular/core/testing";
import {
    HttpClientTestingModule,
    HttpTestingController,
} from "@angular/common/http/testing";
import {StartupPasswordComponent} from "./startup-password.component";
import {KeyStoreSessionService} from "./key-store-session.service";
import {DEGRADED_MODE, PROMPT_MODE, UNLOCKED_MODE} from "./key-store-session";

describe("StartupPasswordComponent", () => {
    let fixture: ComponentFixture<StartupPasswordComponent>;
    let session: KeyStoreSessionService;
    let http: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, StartupPasswordComponent],
        }).compileComponents();
        session = TestBed.inject(KeyStoreSessionService);
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(StartupPasswordComponent);
        fixture.detectChanges();
    });

    afterEach(() => {
        http.verify();
    });

    it("offers password, OK, and Cancel", () => {
        const input = fixture.nativeElement.querySelector(
            "#startup-password-input",
        ) as HTMLInputElement;
        expect(input.type).toBe("password");
        expect(
            fixture.nativeElement.querySelector("#startup-password-ok")
                .textContent,
        ).toContain("OK");
        expect(
            fixture.nativeElement.querySelector("#startup-password-cancel")
                .textContent,
        ).toContain("Cancel");
    });

    it("cancel leaves degraded mode and clears a previous password error", () => {
        const input = fixture.nativeElement.querySelector(
            "#startup-password-input",
        ) as HTMLInputElement;
        input.value = "wrong-password";
        input.dispatchEvent(new Event("input"));
        fixture.nativeElement.querySelector("#startup-password-ok").click();

        const req = http.expectOne("/api/system/key-store/unlock");
        req.flush(
            {
                successful: false,
                credentials: [],
                error: "Wrong password. No keys are available.",
            },
            {status: 401, statusText: "Unauthorized"},
        );
        fixture.detectChanges();

        expect(session.mode).toBe(PROMPT_MODE);
        expect(session.error).toBe("Wrong password. No keys are available.");
        expect(
            fixture.nativeElement.querySelector("#startup-password-error")
                .textContent,
        ).toContain("Wrong password. No keys are available.");

        fixture.nativeElement.querySelector("#startup-password-cancel").click();
        fixture.detectChanges();

        expect(session.mode).toBe(DEGRADED_MODE);
        expect(session.error).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#startup-password-error"),
        ).toBeNull();
    });

    it("OK unlocks the store", () => {
        const input = fixture.nativeElement.querySelector(
            "#startup-password-input",
        ) as HTMLInputElement;
        input.value = "operator-secret";
        input.dispatchEvent(new Event("input"));
        fixture.nativeElement.querySelector("#startup-password-ok").click();

        const req = http.expectOne("/api/system/key-store/unlock");
        expect(req.request.body).toEqual({password: "operator-secret"});
        req.flush({
            successful: true,
            credentials: [{credentialRef: "provider-4"}],
        });
        fixture.detectChanges();

        expect(session.mode).toBe(UNLOCKED_MODE);
        expect(session.error).toBeNull();
        expect(JSON.stringify(req.request.body)).not.toContain("sk-");
    });

    it("an empty unlock stays in degraded mode and is not an error", () => {
        const input = fixture.nativeElement.querySelector(
            "#startup-password-input",
        ) as HTMLInputElement;
        input.value = "operator-secret";
        input.dispatchEvent(new Event("input"));
        fixture.nativeElement.querySelector("#startup-password-ok").click();

        const req = http.expectOne("/api/system/key-store/unlock");
        req.flush({successful: true, credentials: []});
        fixture.detectChanges();

        expect(session.mode).toBe(DEGRADED_MODE);
        expect(session.error).toBeNull();
        expect(
            fixture.nativeElement.querySelector("#startup-password-error"),
        ).toBeNull();
    });
});
