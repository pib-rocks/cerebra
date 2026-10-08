import {
    AfterViewChecked,
    Component,
    ElementRef,
    Input,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    DestroyRef,
    TemplateRef,
    ViewChild,
    inject,
} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ActivatedRoute, NavigationStart, Router} from "@angular/router";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {Observable} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {CerebraRegex} from "src/app/shared/types/cerebra-regex";
import {PersonalityDescriptionComponent} from "../personality-description/personality-description.component";

@Component({
    selector: "app-voice-assistant-nav",
    templateUrl: "./voice-assistant-nav.component.html",
    styleUrls: ["./voice-assistant-nav.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PersonalityDescriptionComponent],
})
export class VoiceAssistantNavComponent implements OnInit, AfterViewChecked {
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild("personalitySelect")
    private personalitySelect?: ElementRef<HTMLSelectElement>;

    @ViewChild("descriptionModal")
    private descriptionModal?: TemplateRef<unknown>;

    sidebarElements?: SidebarElement[];
    selectedPersonalityId = "";
    @Input() subject?: Observable<SidebarElement[]>;
    @Input() button?: {enabled: boolean; func: () => void};
    /** Opens the shared add/edit dialog for the active personality. */
    @Input() editButton?: {
        enabled: boolean;
        func: (personalityId: string) => void;
    };
    @Input() defaultRoute?: string;
    @Input() needsAttention?: (id: string) => boolean;
    @Input() attentionLabel?: (id: string) => string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private changeDetector: ChangeDetectorRef,
        private modalService: NgbModal,
    ) {}

    ngOnInit(): void {
        this.router.events
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => {
                if (event instanceof NavigationStart) {
                    if (
                        RegExp("/voice-assistant/" + CerebraRegex.UUID).test(
                            this.router.url,
                        ) &&
                        event.url === "/voice-assistant"
                    ) {
                        if (
                            this.sidebarElements &&
                            this.sidebarElements.length > 0
                        ) {
                            this.router.navigate(
                                [this.sidebarElements[0].getUUID(), "chat"],
                                {relativeTo: this.route},
                            );
                        }
                    }
                }
            });

        this.subject
            ?.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((elements) => {
                const diff =
                    elements.length - (this.sidebarElements?.length ?? 0);
                const len = this.sidebarElements?.length ?? 0;
                this.sidebarElements = elements;
                if (len == 0 && elements.length > 0) {
                    this.selectedPersonalityId = elements[0].getUUID();
                    this.router.navigate([this.selectedPersonalityId, "chat"], {
                        relativeTo: this.route,
                    });
                } else if (diff > 0 && len != 0) {
                    this.selectedPersonalityId =
                        elements[elements.length - 1].getUUID();
                    this.router.navigate([this.selectedPersonalityId, "chat"], {
                        relativeTo: this.route,
                    });
                } else {
                    // A plain list update (an edit, a save) must not move the
                    // user: only redirect when the routed personality is gone.
                    const current = this.currentRoutePersonalityId();
                    const gone =
                        current != null &&
                        !elements.some(
                            (element) => element.getUUID() === current,
                        );
                    if (gone) {
                        const redirect = this.getRedirectRoute();
                        if (redirect) {
                            this.selectedPersonalityId = redirect;
                            this.router.navigate([redirect], {
                                relativeTo: this.route,
                            });
                        } else {
                            this.router.navigate([this.defaultRoute]);
                        }
                    }
                }
                // Zoneless: a later subject emission does not refresh the view on its own.
                this.changeDetector.markForCheck();
            });
    }

    ngAfterViewChecked(): void {
        // The new option is in the DOM by this hook, so the select can show it
        // before this change-detection pass returns.
        const select = this.personalitySelect?.nativeElement;
        if (
            select != null &&
            this.selectedPersonalityId !== "" &&
            select.value !== this.selectedPersonalityId
        ) {
            select.value = this.selectedPersonalityId;
        }
    }

    openDescriptionModal(): void {
        this.openModal(
            this.descriptionModal,
            "personality-description-modal-title",
        );
    }

    /**
     * The settings button opens the shared add/edit dialog. The dialog owns
     * Save/Cancel; the former right-hand settings component is gone.
     */
    openSettings(): void {
        const personalityId = this.activePersonalityId();
        if (personalityId === "") {
            return;
        }
        this.editButton?.func(personalityId);
    }

    /** The personality the route points at, or the selected one as a fallback. */
    activePersonalityId(): string {
        return this.currentRoutePersonalityId() ?? this.selectedPersonalityId;
    }

    private currentRoutePersonalityId(): string | undefined {
        return this.router.url
            .split("/")
            .find((segment) => RegExp(CerebraRegex.UUID).test(segment));
    }

    private openModal(
        content: TemplateRef<unknown> | undefined,
        ariaLabelledBy: string,
    ): NgbModalRef | undefined {
        if (content == null) {
            return undefined;
        }
        // cerebra-modal stays on the window wrapper. Putting it on
        // modal-content leaves the dialog white on white.
        return this.modalService.open(content, {
            ariaLabelledBy,
            size: "lg",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
    }

    onPersonalityChange(event: Event): void {
        const value = (event.target as HTMLSelectElement | null)?.value ?? "";
        this.onPersonalitySelected(value);
    }

    onPersonalitySelected(personalityId: string): void {
        if (
            personalityId === "" ||
            personalityId === this.selectedPersonalityId
        ) {
            return;
        }
        this.selectedPersonalityId = personalityId;
        this.router.navigate([personalityId, "chat"], {
            relativeTo: this.route,
        });
    }

    get activePersonalityName(): string {
        return (
            this.sidebarElements
                ?.find(
                    (element) =>
                        element.getUUID() === this.selectedPersonalityId,
                )
                ?.getName() ?? ""
        );
    }

    optionLabel(element: SidebarElement): string {
        const name = element.getName();
        const id = element.getUUID();
        if (!this.needsAttention?.(id)) {
            return name;
        }
        return `${name} (${this.attentionLabel?.(id) || "Needs a key"})`;
    }

    activeNeedsAttention(): boolean {
        return (
            this.selectedPersonalityId !== "" &&
            (this.needsAttention?.(this.selectedPersonalityId) ?? false)
        );
    }

    activeAttentionLabel(): string {
        return (
            this.attentionLabel?.(this.selectedPersonalityId) || "Needs a key"
        );
    }

    getRedirectRoute(): string | undefined {
        const routerUuid = this.currentRoutePersonalityId();
        if (routerUuid && this.sidebarElements) {
            const elem = this.sidebarElements.find((sidebarElement) =>
                RegExp(routerUuid).test(sidebarElement.getUUID()),
            );
            if (!elem && this.sidebarElements.length > 0) {
                return this.sidebarElements[0].getUUID();
            } else if (elem) {
                return elem.getUUID();
            }
        }
        return undefined;
    }
}
