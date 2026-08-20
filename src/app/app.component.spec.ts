import {TestBed, ComponentFixture} from "@angular/core/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {AppComponent} from "./app.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";
import {BehaviorSubject} from "rxjs";
import {RosService} from "./shared/services/ros-service/ros.service";
import {
    RIGHT_UPPER_ARM_READY_STATE,
    RightUpperArmRecoveryState,
} from "./shared/types/right-upper-arm-recovery-state";

describe("AppComponent", () => {
    let fixture: ComponentFixture<AppComponent>;
    let recoveryStateReceiver$: BehaviorSubject<RightUpperArmRecoveryState>;

    beforeEach(async () => {
        document.cookie = "viewall=; Path=/; Max-Age=0; SameSite=Lax";
        recoveryStateReceiver$ =
            new BehaviorSubject<RightUpperArmRecoveryState>({
                ...RIGHT_UPPER_ARM_READY_STATE,
            });
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [
                AppComponent,
                SmartConnectComponent,
                RelayControlComponent,
                IpRetrieverComponent,
            ],
            providers: [
                {
                    provide: RosService,
                    useValue: {
                        rightUpperArmRecoveryStateReceiver$:
                            recoveryStateReceiver$,
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

    it("blocks the complete interface while recovery is active", () => {
        recoveryStateReceiver$.next({
            ...RIGHT_UPPER_ARM_READY_STATE,
            active: true,
            state: "recovering",
            message: "Please wait while pib recovers the arm.",
            progress_percent: 45,
        });

        fixture.detectChanges();

        const overlay = fixture.nativeElement.querySelector(
            "[data-test='MODAL_Right_Upper_Arm_Recovery']",
        );
        const application = fixture.nativeElement.querySelector(".wrapper");
        expect(overlay).not.toBeNull();
        expect(overlay.querySelector("button")).toBeNull();
        expect(application.hasAttribute("inert")).toBeTrue();
        expect(application.getAttribute("aria-hidden")).toBe("true");
    });

    it("unlocks the interface only after recovery becomes inactive", () => {
        recoveryStateReceiver$.next({
            ...RIGHT_UPPER_ARM_READY_STATE,
            active: true,
            state: "recovering",
        });
        fixture.detectChanges();

        recoveryStateReceiver$.next({...RIGHT_UPPER_ARM_READY_STATE});
        fixture.detectChanges();

        expect(
            fixture.nativeElement.querySelector(
                "[data-test='MODAL_Right_Upper_Arm_Recovery']",
            ),
        ).toBeNull();
        expect(
            fixture.nativeElement
                .querySelector(".wrapper")
                .hasAttribute("inert"),
        ).toBeFalse();
    });
});
