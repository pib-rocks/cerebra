import {ComponentFixture, TestBed, fakeAsync} from "@angular/core/testing";
import {SmartConnectComponent} from "./smart-connect.component";
import {ReactiveFormsModule} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {of, Subject} from "rxjs";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {TemplateRef} from "@angular/core";
import {TokenService} from "src/app/shared/services/token.service";

describe("SmartConnectComponent", () => {
    let component: SmartConnectComponent;
    let fixture: ComponentFixture<SmartConnectComponent>;
    let mockRosService: jasmine.SpyObj<RosService>;
    let mockTokenService: jasmine.SpyObj<TokenService>;
    let mockNgbModal: jasmine.SpyObj<NgbModal>;
    let tokenStatus$: Subject<any>;

    beforeEach(async () => {
        mockRosService = jasmine.createSpyObj("RosService", [
            "checkTokenExists",
            "encryptToken",
            "decryptToken",
            "deleteTokenMessage",
        ]);

        tokenStatus$ = new Subject<any>();
        mockTokenService = jasmine.createSpyObj(
            "TokenService",
            ["checkTokenExists"],
            {
                tokenStatus$: tokenStatus$.asObservable(),
            },
        );

        mockNgbModal = jasmine.createSpyObj("NgbModal", ["open", "dismissAll"]);

        await TestBed.configureTestingModule({
            declarations: [SmartConnectComponent],
            imports: [ReactiveFormsModule],
            providers: [
                {provide: RosService, useValue: mockRosService},
                {provide: TokenService, useValue: mockTokenService},
                {provide: NgbModal, useValue: mockNgbModal},
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SmartConnectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should initialize forms with default values", () => {
        expect(component.encryptTokenForm.value).toEqual({
            token: "",
            password: "",
            confirmPassword: "",
        });
        expect(component.decryptTokenForm.value).toEqual({
            password: "",
        });
    });

    it("should validate password match", () => {
        const token = "testToken";
        const password = "testPassword";

        component.encryptTokenForm.setValue({
            token: token,
            password: password,
            confirmPassword: password,
        });
        expect(component.encryptTokenForm.valid).toBeTrue();

        component.encryptTokenForm.setValue({
            token: token,
            password: password,
            confirmPassword: "differentPassword",
        });
        expect(
            component.encryptTokenForm.get("confirmPassword")?.errors,
        ).toEqual({mismatch: true});
    });

    it("should toggle password text type", () => {
        const initialType = component.passwordTextType;
        component.togglePasswordTextType();
        expect(component.passwordTextType).toBe(!initialType);
    });

    it("should open modal and set token states", fakeAsync(() => {
        const modalRef = {
            dismissed: of(null),
        } as NgbModalRef;

        mockNgbModal.open.and.returnValue(modalRef);

        const content: TemplateRef<any> = {} as TemplateRef<any>;
        component.onOpenModal(content);

        tokenStatus$.next({tokenExists: true, tokenActive: true});

        expect(mockTokenService.checkTokenExists).toHaveBeenCalled();
        expect(component.isTokenStored).toBeTrue();
        expect(component.isTokenActive).toBeTrue();
        expect(component.isLoadingModal).toBeFalse();
    }));

    it("should handle encrypt token form submission", fakeAsync(() => {
        const token = "testToken";
        const password = "testPassword";
        component.encryptTokenForm.setValue({
            token: token,
            password: password,
            confirmPassword: password,
        });

        mockRosService.encryptToken.and.returnValue(of(true));

        component.onSubmitEncryptToken();
        expect(mockRosService.encryptToken).toHaveBeenCalledWith(
            token,
            password,
        );
        expect(component.onErrorSubmit).toBeFalse();
    }));

    it("should handle decrypt token form submission", fakeAsync(() => {
        const password = "testPassword";
        component.decryptTokenForm.setValue({
            password: password,
        });

        mockRosService.decryptToken.and.returnValue(of(true));

        component.onSubmitDecryptToken();

        expect(mockRosService.decryptToken).toHaveBeenCalledWith(password);
        expect(component.onErrorSubmit).toBeFalse();
    }));

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
});
