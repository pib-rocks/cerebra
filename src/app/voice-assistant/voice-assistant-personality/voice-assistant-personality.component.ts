import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {VoiceAssistantService} from "../../shared/services/voice-assistant.service";
import {VoiceAssistant} from "../../shared/types/voice-assistant";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {Observable} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: "app-voice-assistant-personality",
    templateUrl: "./voice-assistant-personality.component.html",
    styleUrls: ["./voice-assistant-personality.component.css"],
})
export class VoiceAssistantPersonalityComponent implements OnInit {
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    ngbModalRef?: NgbModalRef;
    personalityIcon: string =
        "../../assets/voice-assistant-svgs/personality/personality.svg";
    thresholdString: string | undefined;
    subject!: Observable<SidebarElement[]>;
    uuid: string | undefined;
    personalityForm!: FormGroup;

    constructor(
        private modalService: NgbModal,
        private voiceAssistantService: VoiceAssistantService,
        private router: Router,
    ) {}

    ngOnInit() {
        localStorage.setItem("voice-assistant-tab", "personality");
        this.personalityForm = new FormGroup({
            "name-input": new FormControl("", {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(255),
                ],
            }),
            gender: new FormControl("Female", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            pausethreshold: new FormControl(0.8, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.min(0.1),
                    Validators.max(3),
                ],
            }),
        });
        this.subject = this.voiceAssistantService.getSubject();
    }

    showModal = () => {
        return (this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "myCustomModalClass",
            backdropClass: "myCustomBackdropClass",
        }));
    };

    savePersonality = () => {
        if (this.personalityForm.valid) {
            if (this.uuid) {
                this.editPersonality(this.uuid);
            } else {
                this.addPersonality();
            }
        }
        this.ngbModalRef?.close("saved");
    };

    closeModal = () => {
        this.ngbModalRef?.close("cancelled");
    };

    adjustThreshold(step: string) {
        const newValue =
            (Number(this.personalityForm.controls["pausethreshold"].value) *
                10 +
                Number(step) * 10) /
            10;
        this.personalityForm.patchValue({
            pausethreshold: newValue,
        });
        if (this.personalityForm.controls["pausethreshold"].hasError("min")) {
            this.personalityForm.patchValue({
                pausethreshold: 0.1,
            });
        }
        if (this.personalityForm.controls["pausethreshold"].hasError("max")) {
            this.personalityForm.patchValue({
                pausethreshold: 3,
            });
        }
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value + "s";
    }

    openAddModal = () => {
        this.personalityForm.reset();
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value + "s";
        this.showModal();
    };

    openEditModal = () => {
        this.uuid =
            this.router.url.split("/").length > 3
                ? this.router.url.split("/").pop()
                : undefined;
        if (this.uuid && this.voiceAssistantService.personalities.length > 0) {
            const updatePersonality = this.voiceAssistantService.getPersonality(
                this.uuid,
            );
            this.personalityForm.patchValue({
                "name-input": updatePersonality?.name,
                gender: updatePersonality?.gender,
                pausethreshold: updatePersonality?.pauseThreshold,
            });
            this.thresholdString =
                this.personalityForm.controls["pausethreshold"].value + "s";
            this.showModal();
        }
    };

    addPersonality() {
        if (this.personalityForm.valid) {
            this.voiceAssistantService.createPersonality(
                new VoiceAssistant(
                    "",
                    this.personalityForm.controls["name-input"].value,
                    this.personalityForm.controls["gender"].value,
                    this.personalityForm.controls["pausethreshold"].value,
                ),
            );
        }
    }

    editPersonality = (uuid: string) => {
        const updatePersonality = this.voiceAssistantService
            .getPersonality(uuid)
            ?.clone();
        if (updatePersonality) {
            updatePersonality.name =
                this.personalityForm.controls["name-input"].value;
            updatePersonality.gender =
                this.personalityForm.controls["gender"].value;
            updatePersonality.pauseThreshold =
                this.personalityForm.controls["pausethreshold"].value;
            this.voiceAssistantService.updatePersonalityById(updatePersonality);
        }
        this.uuid = undefined;
    };

    deletePersonality = () => {
        const uuid = this.router.url.split("/").pop();
        if (uuid && this.voiceAssistantService.personalities.length > 0) {
            this.voiceAssistantService.deletePersonalityById(uuid);
            localStorage.setItem("personality", "");
        }
    };

    headerElements = [
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_add.svg",
            label: "ADD",
            clickCallback: this.openAddModal,
        },
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_delete.svg",
            label: "DELETE",
            clickCallback: this.deletePersonality,
        },
        {
            icon: "../../assets/voice-assistant-svgs/personality/personality_edit.svg",
            label: "EDIT",
            clickCallback: this.openEditModal,
        },
    ];
}
