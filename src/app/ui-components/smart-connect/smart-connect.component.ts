import {Component, OnInit, TemplateRef} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    AbstractControl,
    FormControl,
    FormGroup,
    Validators,
} from "@angular/forms";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {TokenService} from "src/app/shared/services/token.service";

@Component({
    selector: "app-smart-connect",
    templateUrl: "./smart-connect.component.html",
    styleUrls: ["./smart-connect.component.css"],
})
export class SmartConnectComponent implements OnInit {
    // prevent user from opening modal multiple times in case of delay
    isLoadingModal: boolean = false;
    // decide password input field types
    passwordTextType: boolean = true;
    isTokenStored: boolean = false;
    isTokenActive: boolean = false;
    onErrorSubmit: boolean = false;
    encryptTokenForm = new FormGroup(
        {
            token: new FormControl("", [Validators.required]),
            password: new FormControl("", [
                Validators.required,
                Validators.minLength(8),
            ]),
            confirmPassword: new FormControl("", [Validators.required]),
        },
        {validators: this.passwordMatchValidator},
    );
    decryptTokenForm = new FormGroup({
        password: new FormControl({value: "", disabled: this.isTokenActive}, [
            Validators.required,
        ]),
    });

    constructor(
        private readonly rosService: RosService,
        private readonly modalService: NgbModal,
        private readonly tokenService: TokenService,
    ) {}

    ngOnInit(): void {
        this.tokenService.tokenStatus$.subscribe((response) => {
            this.isTokenStored = response.tokenExists;
            this.isTokenActive = response.tokenActive;
        });
    }

    passwordMatchValidator(form: AbstractControl): null {
        const password = form.get("password")?.value;
        const confirmPassword = form.get("confirmPassword")?.value;

        if (password !== confirmPassword && confirmPassword.length > 0) {
            form.get("confirmPassword")?.setErrors({mismatch: true});
        } else {
            form.get("confirmPassword")?.setErrors(null);
        }
        return null;
    }

    togglePasswordTextType() {
        this.passwordTextType = !this.passwordTextType;
    }

    onOpenModal(content: TemplateRef<any>) {
        this.isLoadingModal = true;
        this.tokenService.checkTokenExists();
        this.updatePasswordControlState();
        this.modalService
            .open(content, {
                ariaLabelledBy: "modal-basic-title",
                size: "md",
                windowClass: "cerebra-modal",
                backdropClass: "cerebra-modal-backdrop",
            })
            .dismissed.subscribe(() => {
                this.onErrorSubmit = false;
                this.encryptTokenForm.reset();
                this.decryptTokenForm.reset();
            });
        this.isLoadingModal = false;
    }

    onCloseModal() {
        this.modalService.dismissAll();
    }

    onSubmitEncryptToken() {
        if (!this.encryptTokenForm.valid) {
            return;
        }
        // never null, because form needs to be valid
        this.rosService
            .encryptToken(
                this.encryptTokenForm.value.token!,
                this.encryptTokenForm.value.password!,
            )
            .subscribe((isSuccessful) => {
                this.submitFormSuccessful(isSuccessful);
            });
    }

    onSubmitDecryptToken() {
        if (!this.decryptTokenForm.valid) {
            return;
        }
        // never null, because form needs to be valid
        this.rosService
            .decryptToken(this.decryptTokenForm.value.password!)
            .subscribe((isSuccessful) => {
                this.submitFormSuccessful(isSuccessful);
            });
    }

    onDeleteToken() {
        this.rosService.deleteTokenMessage();
        this.decryptTokenForm.controls["password"].enable();
        this.tokenService.checkTokenExists();
    }

    private submitFormSuccessful(isSuccessful: boolean) {
        this.onErrorSubmit = !isSuccessful;
        if (isSuccessful) {
            this.tokenService.checkTokenExists();
            this.onCloseModal();
        }
    }

    private updatePasswordControlState() {
        if (this.isTokenActive) {
            this.decryptTokenForm.controls["password"].disable();
        } else {
            this.decryptTokenForm.controls["password"].enable();
        }
    }
}
