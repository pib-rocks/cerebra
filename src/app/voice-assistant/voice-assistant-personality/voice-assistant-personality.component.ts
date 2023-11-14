import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
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
    personalityIcon: string =
        "../../assets/voice-assistant-svgs/personality/personality.svg";
    validPauseThresholdPattern: RegExp = /^(0\.[1-9]\d*|1\.0*)$/;
    nameFormControl: FormControl = new FormControl("");
    genderFormControl: FormControl = new FormControl("");
    pauseThresholdFormControl: FormControl<number> = new FormControl();
    thresholdString: string | undefined;
    subject!: Observable<SidebarElement[]>;

    constructor(
        private modalService: NgbModal,
        private voiceAssistantService: VoiceAssistantService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        localStorage.setItem("voice-assistant-tab", "personality");
        this.subject = this.voiceAssistantService.getSubject();
        this.nameFormControl.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
        ]);
        this.genderFormControl.setValidators([Validators.required]);
        this.pauseThresholdFormControl.setValidators([
            Validators.required,
            Validators.pattern(this.validPauseThresholdPattern),
            Validators.max(3),
            Validators.min(0.1),
        ]);
    }

    showModal = (uuid?: string) => {
        return this.modalService
            .open(this.modalContent, {
                ariaLabelledBy: "modal-basic-title",
                size: "sm",
                windowClass: "myCustomModalClass",
                backdropClass: "myCustomBackdropClass",
            })
            .result.then(
                (result) => {
                    console.log(`Closed with: ${result}`);
                },
                () => {
                    if (uuid) {
                        this.editPersonality(uuid);
                    } else {
                        this.addPersonality();
                    }
                },
            );
    };

    adjustThreshold(step: string) {
        this.pauseThresholdFormControl.setValue(
            (Number(this.pauseThresholdFormControl.value) * 10 +
                Number(step) * 10) /
                10,
        );
        this.thresholdString = this.pauseThresholdFormControl.value + "s";
    }

    formControlsValid() {
        if (
            this.nameFormControl.valid &&
            this.genderFormControl.valid &&
            this.pauseThresholdFormControl.valid
        ) {
            return true;
        }
        return false;
    }
    openAddModal = () => {
        this.nameFormControl.setValue("");
        this.genderFormControl.setValue("");
        this.pauseThresholdFormControl.setValue(0.0);
        this.thresholdString = this.pauseThresholdFormControl.value + "s";
        this.showModal();
    };

    openEditModal = () => {
        const uuid: string = this.router.parseUrl(this.router.url).root
            .children["primary"].segments[2].path;
        if (uuid) {
            const updatePersonality =
                this.voiceAssistantService.getPersonality(uuid);
            this.nameFormControl.setValue(updatePersonality?.name ?? "");
            this.genderFormControl.setValue(updatePersonality?.gender ?? "");
            this.pauseThresholdFormControl.setValue(
                updatePersonality?.pauseThreshold ?? 0,
            );
            this.thresholdString = this.pauseThresholdFormControl.value + "s";
            this.showModal(uuid);
        }
    };

    addPersonality() {
        if (this.formControlsValid()) {
            this.voiceAssistantService.createPersonality(
                new VoiceAssistant(
                    "",
                    this.nameFormControl.value,
                    this.genderFormControl.value,
                    this.pauseThresholdFormControl.value,
                ),
            );
        }
    }

    editPersonality = (uuid: string) => {
        const updatePersonality = this.voiceAssistantService
            .getPersonality(uuid)
            ?.clone();
        if (updatePersonality) {
            updatePersonality.name = this.nameFormControl.value;
            updatePersonality.gender = this.genderFormControl.value;
            updatePersonality.pauseThreshold =
                this.pauseThresholdFormControl.value;
            this.voiceAssistantService.updatePersonalityById(updatePersonality);
        }
    };

    deletePersonality = () => {
        this.voiceAssistantService.deletePersonalityById(
            this.router.parseUrl(this.router.url).root.children["primary"]
                .segments[2].path,
        );
        this.router.navigate(
            [
                this.voiceAssistantService.personalities[0].personalityId ===
                this.router.parseUrl(this.router.url).root.children["primary"]
                    .segments[2].path
                    ? this.voiceAssistantService.personalities[1].personalityId
                    : this.voiceAssistantService.personalities[0].personalityId,
            ],
            {relativeTo: this.route},
        );
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
