import {Component, TemplateRef} from "@angular/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    AbstractControl,
    FormControl,
    FormGroup,
    Validators,
} from "@angular/forms";
import {RosService} from "../../shared/services/ros-service/ros.service";

@Component({
    selector: "app-smart-connect",
    templateUrl: "./smart-connect.component.html",
    styleUrls: ["./smart-connect.component.css"],
})
export class SmartConnectComponent {
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
        private rosService: RosService,
        private modalService: NgbModal,
    ) {}

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

    tooglePasswordTextType() {
        this.passwordTextType = !this.passwordTextType;
    }

    onOpenModal(content: TemplateRef<any>) {
        this.rosService.checkTokenExists().subscribe((response) => {
            this.isTokenStored = response.token_exists;
            this.isTokenActive = response.token_active;
            this.updatePasswordControlState();
            this.modalService
                .open(content, {
                    ariaLabelledBy: "modal-basic-title",
                    size: "md",
                    windowClass: "myCustomModalClass",
                    backdropClass: "myCustomBackdropClass",
                })
                .dismissed.subscribe(() => {
                    this.onErrorSubmit = false;
                    this.encryptTokenForm.reset();
                    this.decryptTokenForm.reset();
                });
        });
    }

    onCloseModal() {
        this.modalService.dismissAll();
    }

    onSubmitEncryptToken() {
        if (!this.encryptTokenForm.valid) {
            return;
        }
        console.log("CALL ROS SERVICE");
        // never null, because form needs to be valid
        this.rosService
            .encryptToken(
                this.encryptTokenForm.value.token!,
                this.encryptTokenForm.value.password!,
            )
            .subscribe((isSuccessful) => {
                console.log("Is SUCCESSFUL: ", isSuccessful);
                this.onErrorSubmit = !isSuccessful;
                this.submitFormSuccessful(isSuccessful);
            });
    }

    onSubmitDecryptToken() {
        if (!this.decryptTokenForm.valid) {
            return;
        }
        console.log("FORM:", this.decryptTokenForm.value);
        // never null, because form needs to be valid
        this.rosService
            .decryptToken(this.decryptTokenForm.value.password!)
            .subscribe((isSuccessful) => {
                console.log("Is SUCCESSFUL: ", isSuccessful);
                this.onErrorSubmit = !isSuccessful;
                this.submitFormSuccessful(isSuccessful);
            });
    }

    onDeleteToken() {
        this.rosService.deleteTokenMessage();
        this.decryptTokenForm.controls["password"].enable();
        this.isTokenActive = false;
        this.isTokenStored = false;
    }

    private submitFormSuccessful(isSuccessful: boolean) {
        if (isSuccessful) {
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
