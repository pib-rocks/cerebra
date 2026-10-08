import {ComponentFixture, TestBed, fakeAsync} from "@angular/core/testing";
import {SmartConnectComponent} from "./smart-connect.component";
import {ReactiveFormsModule} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {RouterTestingModule} from "@angular/router/testing";
import {EmbeddedViewRef, TemplateRef} from "@angular/core";
import {of, Subject, throwError} from "rxjs";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {TokenService} from "src/app/shared/services/token.service";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

describe("SmartConnectComponent", () => {
    let component: SmartConnectComponent;
    let fixture: ComponentFixture<SmartConnectComponent>;
    let mockRosService: jasmine.SpyObj<RosService>;
    let mockTokenService: jasmine.SpyObj<TokenService>;
    let mockApiService: jasmine.SpyObj<ApiService>;
    let mockNgbModal: jasmine.SpyObj<NgbModal>;
    let tokenStatus$: Subject<{
        tokenExists: boolean;
        tokenActive: boolean;
    }>;

    beforeEach(async () => {
        mockRosService = jasmine.createSpyObj("RosService", [
            "checkTokenExists",
            "encryptToken",
            "decryptToken",
            "deleteTokenMessage",
        ]);

        tokenStatus$ = new Subject();
        mockTokenService = jasmine.createSpyObj(
            "TokenService",
            ["checkTokenExists"],
            {
                tokenStatus$: tokenStatus$.asObservable(),
            },
        );

        mockApiService = jasmine.createSpyObj("ApiService", ["post"]);
        mockNgbModal = jasmine.createSpyObj("NgbModal", ["open", "dismissAll"]);

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

    it("points at System > Keys and asks for no password when the key is missing", () => {
        tokenStatus$.next({tokenExists: true, tokenActive: false});
        fixture.detectChanges();

        const host = dialog();

        expect(host.querySelector("input[type=password]")).toBeNull();
        expect(host.querySelector("[data-test=TXT_Password]")).toBeNull();
        expect(
            host.querySelector("[data-test=TXT_Password_confirm]"),
        ).toBeNull();
        expect(host.textContent).toContain("System > Keys");
        const link = host.querySelector(
            "[data-test=LNK_System_Keys]",
        ) as HTMLAnchorElement;
        expect(link.getAttribute("href")).toBe("/system/keys");
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
});
