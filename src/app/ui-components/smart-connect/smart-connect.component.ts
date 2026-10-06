import {
    Component,
    OnInit,
    TemplateRef,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    FormControl,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {TokenService} from "src/app/shared/services/token.service";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {NgClass, NgOptimizedImage} from "@angular/common";

@Component({
    selector: "app-smart-connect",
    templateUrl: "./smart-connect.component.html",
    styleUrls: ["./smart-connect.component.css"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, NgOptimizedImage, ReactiveFormsModule, RouterLink],
})
export class SmartConnectComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);

    // prevent user from opening modal multiple times in case of delay
    isLoadingModal: boolean = false;
    isTokenStored: boolean = false;
    isTokenActive: boolean = false;
    onErrorSubmit: boolean = false;
    tokenForm = new FormGroup({
        token: new FormControl("", [Validators.required]),
    });

    constructor(
        private readonly rosService: RosService,
        private readonly modalService: NgbModal,
        private readonly tokenService: TokenService,
        private readonly apiService: ApiService,
    ) {}

    ngOnInit(): void {
        this.tokenService.tokenStatus$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.isTokenStored = response.tokenExists;
                this.isTokenActive = response.tokenActive;
            });
    }

    onOpenModal(content: TemplateRef<any>) {
        this.isLoadingModal = true;
        this.tokenService.checkTokenExists();
        this.modalService
            .open(content, {
                ariaLabelledBy: "modal-basic-title",
                size: "md",
                windowClass: "cerebra-modal",
                backdropClass: "cerebra-modal-backdrop",
            })
            .dismissed.subscribe(() => {
                this.onErrorSubmit = false;
                this.tokenForm.reset();
            });
        this.isLoadingModal = false;
    }

    onCloseModal() {
        this.modalService.dismissAll();
    }

    onSubmitToken() {
        if (!this.tokenForm.valid) {
            return;
        }
        this.apiService
            .post(UrlConstants.SMART_CONNECT, {
                token: this.tokenForm.value.token!,
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.submitFormSuccessful(true),
                error: () => this.submitFormSuccessful(false),
            });
    }

    onDeleteToken() {
        this.rosService.deleteTokenMessage();
        this.tokenService.checkTokenExists();
    }

    private submitFormSuccessful(isSuccessful: boolean) {
        this.onErrorSubmit = !isSuccessful;
        if (isSuccessful) {
            this.tokenService.checkTokenExists();
            this.onCloseModal();
        }
    }
}
