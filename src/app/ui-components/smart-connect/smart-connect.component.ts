import {
    ChangeDetectorRef,
    Component,
    OnInit,
    TemplateRef,
    ChangeDetectionStrategy,
    DestroyRef,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {
    FormControl,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {RosService} from "../../shared/services/ros-service/ros.service";
import {
    TokenService,
    normalizeTokenStatus,
} from "src/app/shared/services/token.service";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {
    TokenProbeState,
    effectiveCloudTokenStored,
} from "src/app/shared/types/provider-registry";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {KeyStoreService} from "src/app/system/keys/key-store.service";
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
    private readonly changeDetector = inject(ChangeDetectorRef);

    // prevent user from opening modal multiple times in case of delay
    isLoadingModal: boolean = false;
    isTokenStored: boolean = false;
    isTokenActive: boolean = false;
    tokenProbe: TokenProbeState = "unknown";
    private probeTokenStored = false;
    private credentialRefs: string[] = [];
    onErrorSubmit: boolean = false;
    tokenForm = new FormGroup({
        token: new FormControl("", [Validators.required]),
    });

    constructor(
        private readonly rosService: RosService,
        private readonly modalService: NgbModal,
        private readonly tokenService: TokenService,
        private readonly apiService: ApiService,
        private readonly voiceAssistantService: VoiceAssistantService,
        private readonly keyStore: KeyStoreService,
    ) {}

    ngOnInit(): void {
        this.keyStore
            .status()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((status) => {
                this.credentialRefs = status.credentialRefs ?? [];
                this.refreshStoredPresence();
                this.changeDetector.markForCheck();
            });
        this.voiceAssistantService.assistantModelsSubject
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.refreshStoredPresence();
                this.changeDetector.markForCheck();
            });
        this.tokenService.tokenStatus$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                const status = normalizeTokenStatus(response);
                this.tokenProbe = status.service;
                this.probeTokenStored = status.tokenExists === true;
                this.isTokenActive = status.tokenActive === true;
                this.refreshStoredPresence();
                this.changeDetector.markForCheck();
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
        this.refreshCredentialMetadata();
    }

    private submitFormSuccessful(isSuccessful: boolean) {
        this.onErrorSubmit = !isSuccessful;
        if (isSuccessful) {
            this.tokenService.checkTokenExists();
            this.refreshCredentialMetadata();
            this.onCloseModal();
        }
    }

    private refreshStoredPresence(): void {
        const models =
            this.voiceAssistantService.assistantModelsSubject?.getValue() ?? [];
        this.isTokenStored = effectiveCloudTokenStored(
            this.probeTokenStored,
            models,
            this.credentialRefs,
        );
    }

    private refreshCredentialMetadata(): void {
        this.voiceAssistantService.getAllAssistantModels();
        this.keyStore
            .status()
            .pipe(take(1))
            .subscribe((status) => {
                this.credentialRefs = status.credentialRefs ?? [];
                this.refreshStoredPresence();
                this.changeDetector.markForCheck();
            });
    }
}
