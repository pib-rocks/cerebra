import {ComponentFixture, TestBed, fakeAsync} from "@angular/core/testing";
import {SmartConnectComponent} from "./smart-connect.component";
import {ReactiveFormsModule} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {RouterTestingModule} from "@angular/router/testing";
import {
    EmbeddedViewRef,
    TemplateRef,
    provideZonelessChangeDetection,
} from "@angular/core";
import {of, Subject, throwError} from "rxjs";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {
    TokenService,
    normalizeTokenStatus,
} from "src/app/shared/services/token.service";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {KeyStoreService} from "src/app/system/keys/key-store.service";
import {AssistantModel} from "src/app/shared/types/assistantModel";
import {CLOUD_TOKEN_API_NAME} from "src/app/shared/types/provider-registry";
import {BehaviorSubject} from "rxjs";
import {createServiceSpy} from "src/app/shared/testing/create-service-spy";

describe("SmartConnectComponent", () => {
    let component: SmartConnectComponent;
    let fixture: ComponentFixture<SmartConnectComponent>;
    let mockRosService: jasmine.SpyObj<RosService>;
    let mockTokenService: jasmine.SpyObj<TokenService>;
    let mockApiService: jasmine.SpyObj<ApiService>;
    let mockNgbModal: jasmine.SpyObj<NgbModal>;
    // The status stream accepts a probe report: normalizeTokenStatus fills in
    // the service/error fields, so the double may send either shape.
    type TokenStatusInput = Parameters<typeof normalizeTokenStatus>[0];
    let tokenStatus$: Subject<TokenStatusInput>;
    let models$: BehaviorSubject<AssistantModel[]>;
    let mockVoiceAssistant: jasmine.SpyObj<VoiceAssistantService>;
    let mockKeyStore: jasmine.SpyObj<KeyStoreService>;

    beforeEach(async () => {
        mockRosService = jasmine.createSpyObj("RosService", [
            "checkTokenExists",
            "encryptToken",
            "decryptToken",
            "deleteTokenMessage",
        ]);

        tokenStatus$ = new Subject();
        mockTokenService = createServiceSpy<TokenService>(
            "TokenService",
            ["checkTokenExists"],
            {
                tokenStatus$: tokenStatus$.asObservable(),
            },
        );

        mockApiService = jasmine.createSpyObj("ApiService", ["post"]);
        mockNgbModal = jasmine.createSpyObj("NgbModal", ["open", "dismissAll"]);
        models$ = new BehaviorSubject<AssistantModel[]>([]);
        mockVoiceAssistant = createServiceSpy<VoiceAssistantService>(
            "VoiceAssistantService",
            ["getAllAssistantModels"],
            {assistantModelsSubject: models$},
        );
        mockKeyStore = jasmine.createSpyObj("KeyStoreService", ["status"]);
        mockKeyStore.status.and.returnValue(
            of({encryptKeyStorage: true, credentialRefs: []}),
        );

        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                RouterTestingModule,
                SmartConnectComponent,
            ],
            providers: [
                {provide: RosService, useValue: mockRosService},
                {provide: TokenService, useValue: mockTokenService},
                {provide: ApiService, useValue: mockApiService},
                {provide: NgbModal, useValue: mockNgbModal},
                {provide: VoiceAssistantService, useValue: mockVoiceAssistant},
                {provide: KeyStoreService, useValue: mockKeyStore},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SmartConnectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function dialog(): HTMLElement {
        let templateRef!: TemplateRef<unknown>;
        mockNgbModal.open.and.callFake((template: TemplateRef<unknown>) => {
            templateRef = template;
            return {dismissed: of(null)} as NgbModalRef;
        });
        fixture.nativeElement
            .querySelector("[data-test=BTN_Smart_Connect]")
            .click();
        fixture.detectChanges();
        const embedded: EmbeddedViewRef<unknown> =
            templateRef.createEmbeddedView({});
        embedded.detectChanges();
        const host = document.createElement("div");
        for (const node of embedded.rootNodes) {
            if (node instanceof Node) {
                host.appendChild(node);
            }
        }
        return host;
    }

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should initialize the token form without a password", () => {
        expect(component.tokenForm.value).toEqual({
            token: "",
        });
        expect(component.tokenForm.contains("password")).toBeFalse();
        expect(component.tokenForm.contains("confirmPassword")).toBeFalse();
    });

    it("should open modal and set token states", fakeAsync(() => {
        const modalRef = {
            dismissed: of(null),
        } as NgbModalRef;

        mockNgbModal.open.and.returnValue(modalRef);

        component.onOpenModal({} as TemplateRef<unknown>);

        tokenStatus$.next({tokenExists: true, tokenActive: true});

        expect(mockTokenService.checkTokenExists).toHaveBeenCalled();
        expect(component.isTokenStored).toBeTrue();
        expect(component.isTokenActive).toBeTrue();
        expect(component.isLoadingModal).toBeFalse();
    }));

    it("should send only the token to POST /system/smart-connect", fakeAsync(() => {
        const token = "testToken";
        component.tokenForm.setValue({
            token: token,
        });

        mockApiService.post.and.returnValue(of({}));

        component.onSubmitToken();
        expect(mockApiService.post).toHaveBeenCalledWith(
            UrlConstants.SMART_CONNECT,
            {token},
        );
        expect(mockRosService.encryptToken).not.toHaveBeenCalled();
        expect(mockRosService.decryptToken).not.toHaveBeenCalled();
        expect(component.onErrorSubmit).toBeFalse();
        expect(mockTokenService.checkTokenExists).toHaveBeenCalled();
        expect(mockNgbModal.dismissAll).toHaveBeenCalled();
    }));

    it("should not post an empty token", () => {
        component.tokenForm.setValue({token: ""});
        component.onSubmitToken();
        expect(mockApiService.post).not.toHaveBeenCalled();
        expect(mockRosService.encryptToken).not.toHaveBeenCalled();
    });

    it("should keep the dialog open when storing the token fails", () => {
        component.tokenForm.setValue({token: "testToken"});
        mockApiService.post.and.returnValue(
            throwError(() => new Error("offline")),
        );

        component.onSubmitToken();

        expect(component.onErrorSubmit).toBeTrue();
        expect(mockNgbModal.dismissAll).not.toHaveBeenCalled();
    });

    it("should delete token", () => {
        component.onDeleteToken();
        expect(mockRosService.deleteTokenMessage).toHaveBeenCalled();
        expect(mockTokenService.checkTokenExists).toHaveBeenCalled();
        expect(component.isTokenStored).toBeFalse();
        expect(component.isTokenActive).toBeFalse();
    });

    it("should update state on tokenStatus$ subscription", () => {
        tokenStatus$.next({tokenExists: true, tokenActive: false});
        expect(component.isTokenStored).toBeTrue();
        expect(component.isTokenActive).toBeFalse();
    });

    it("keeps an inactive token distinct from a missing key", () => {
        tokenStatus$.next({tokenExists: true, tokenActive: false});
        fixture.detectChanges();

        const host = dialog();

        expect(host.querySelector("input[type=password]")).toBeNull();
        expect(host.querySelector("[data-test=TXT_Password]")).toBeNull();
        expect(
            host.querySelector("[data-test=TXT_Password_confirm]"),
        ).toBeNull();
        expect(host.querySelector("[data-test=TXT_Token]")).toBeNull();
        expect(host.textContent).toContain("stored but not active");
        expect(host.textContent).not.toContain("The key is missing");
        expect(host.textContent).not.toContain("Needs a key");
    });

    it("does not ask for a token again when the token service is unavailable", () => {
        tokenStatus$.next({
            tokenExists: false,
            tokenActive: false,
            service: "unavailable",
            error: "Service /get_token_exists does not exist",
        });
        fixture.detectChanges();

        const host = dialog();

        expect(host.querySelector("[data-test=TXT_Token]")).toBeNull();
        expect(host.textContent).toContain(
            "SmartConnect status is unavailable",
        );
        expect(host.textContent).not.toContain("The key is missing");
        expect(host.textContent).not.toContain("Needs a key");
    });

    it("renders the token field and no password field when the token is not stored", () => {
        tokenStatus$.next({tokenExists: false, tokenActive: false});
        fixture.detectChanges();

        const host = dialog();

        expect(host.querySelector("[data-test=TXT_Token]")).not.toBeNull();
        expect(host.querySelector("input[type=password]")).toBeNull();
        expect(host.querySelector("[data-test=TXT_Password]")).toBeNull();
        expect(host.querySelector("[data-test=BTN_Connect]")).not.toBeNull();
        expect(host.textContent).not.toContain("Password");
    });

    it("treats a persisted cloud credential as stored without a token probe", () => {
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        models$.next([
            new AssistantModel(
                1,
                CLOUD_TOKEN_API_NAME,
                "pib.Cloud",
                true,
                "https://cloud.example/v1",
                flags,
                "provider-1",
                true,
            ),
        ]);
        tokenStatus$.next({tokenExists: false, tokenActive: false});
        fixture.detectChanges();

        expect(component.isTokenStored).toBeTrue();
    });
});

describe("SmartConnectComponent (zoneless)", () => {
    it("renders stored state after catalogue metadata arrives", async () => {
        const tokenStatus$ = new Subject<{
            tokenExists: boolean;
            tokenActive: boolean;
        }>();
        const models$ = new BehaviorSubject<AssistantModel[]>([]);
        const mockVoiceAssistant = createServiceSpy<VoiceAssistantService>(
            "VoiceAssistantService",
            ["getAllAssistantModels"],
            {assistantModelsSubject: models$},
        );
        const mockKeyStore = jasmine.createSpyObj("KeyStoreService", [
            "status",
        ]);
        mockKeyStore.status.and.returnValue(
            of({encryptKeyStorage: true, credentialRefs: []}),
        );

        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                RouterTestingModule,
                SmartConnectComponent,
            ],
            providers: [
                provideZonelessChangeDetection(),
                {
                    provide: RosService,
                    useValue: jasmine.createSpyObj("RosService", [
                        "deleteTokenMessage",
                    ]),
                },
                {
                    provide: TokenService,
                    useValue: createServiceSpy<TokenService>(
                        "TokenService",
                        ["checkTokenExists"],
                        {tokenStatus$: tokenStatus$.asObservable()},
                    ),
                },
                {
                    provide: ApiService,
                    useValue: jasmine.createSpyObj("ApiService", ["post"]),
                },
                {
                    provide: NgbModal,
                    useValue: jasmine.createSpyObj("NgbModal", [
                        "open",
                        "dismissAll",
                    ]),
                },
                {provide: VoiceAssistantService, useValue: mockVoiceAssistant},
                {provide: KeyStoreService, useValue: mockKeyStore},
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(SmartConnectComponent);
        tokenStatus$.next({tokenExists: false, tokenActive: false});
        await fixture.whenStable();
        const flags = {
            tools: true,
            images: true,
            live: false,
            stt: false,
            tts: false,
        };
        models$.next([
            new AssistantModel(
                1,
                CLOUD_TOKEN_API_NAME,
                "pib.Cloud",
                true,
                "https://cloud.example/v1",
                flags,
                "provider-1",
                true,
            ),
        ]);
        await fixture.whenStable();

        expect(fixture.componentInstance.isTokenStored).toBeTrue();
    });
});
