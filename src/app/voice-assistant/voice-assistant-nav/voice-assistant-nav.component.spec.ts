import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantNavComponent} from "./voice-assistant-nav.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {BoolToOnOffPipe} from "../../shared/pipes/bool-to-on-off-pipe.pipe";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {ActivatedRoute, Router} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {VoiceAssistantService} from "src/app/shared/services/voice-assistant.service";
import {TokenService} from "src/app/shared/services/token.service";
import {ChannelCapabilityService} from "src/app/shared/services/channel-capability.service";

describe("VoiceAssistantNavComponent", () => {
    let component: VoiceAssistantNavComponent;
    let fixture: ComponentFixture<VoiceAssistantNavComponent>;
    let elements: SidebarElement[];
    let personalities: VoiceAssistant[];
    let router: Router;
    let subject: BehaviorSubject<SidebarElement[]>;
    let spyOnRouterUrl: jasmine.Spy;
    let navigate: jasmine.Spy;

    beforeEach(async () => {
        personalities = [];
        const voiceAssistantServiceSpy = jasmine.createSpyObj(
            "VoiceAssistantService",
            [
                "getPersonality",
                "updatePersonalityById",
                "deletePersonalityById",
            ],
            {
                personalitiesSubject: new BehaviorSubject<VoiceAssistant[]>([]),
                assistantModelsSubject: new BehaviorSubject([]),
                personalities,
            },
        );
        voiceAssistantServiceSpy.getPersonality.and.callFake((id: string) =>
            personalities.find((item) => item.getUUID() === id),
        );
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
                VoiceAssistantNavComponent,
                BoolToOnOffPipe,
            ],
            providers: [
                {
                    provide: VoiceAssistantService,
                    useValue: voiceAssistantServiceSpy,
                },
                {
                    provide: TokenService,
                    useValue: {
                        tokenStatus$: new BehaviorSubject({
                            tokenExists: true,
                            tokenActive: true,
                        }),
                    },
                },
                {
                    provide: ChannelCapabilityService,
                    useValue: {
                        smartChatsEnabled$: new BehaviorSubject(true),
                    },
                },
            ],
        }).compileComponents();
        router = TestBed.inject(Router);
        elements = [
            new VoiceAssistant(
                "01234567-0123-0123-0123-0123456789ab",
                "123",
                "Female",
                0.8,
                "A written personality",
            ),
            new VoiceAssistant("223", "223", "", 0, ""),
            new VoiceAssistant("323", "323", "", 0, ""),
            new VoiceAssistant("423", "424", "", 0, ""),
            new VoiceAssistant("525", "525", "", 0, ""),
        ];
        personalities.push(...(elements as VoiceAssistant[]));
        subject = new BehaviorSubject<SidebarElement[]>(elements);
        fixture = TestBed.createComponent(VoiceAssistantNavComponent);
        component = fixture.componentInstance;
        component.subject = subject;
        spyOnRouterUrl = spyOnProperty(router, "url").and.returnValue(
            "/voice-assistant/01234567-0123-0123-0123-0123456789ab",
        );
        navigate = spyOn(router, "navigate").and.resolveTo(true);

        fixture.detectChanges();
    });

    afterEach(() => {
        TestBed.inject(NgbModal).dismissAll();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should retrieve the correct route or undefined", () => {
        component.sidebarElements = elements;
        let route = component.getRedirectRoute();
        expect(route).toBe(component.sidebarElements[0].getUUID());
        spyOnRouterUrl.and.returnValue("123");
        route = component.getRedirectRoute();
        expect(route).toBeFalsy();
    });

    it("lists every personality in a drop-down with the active one selected", () => {
        const select = personalitySelect(fixture);
        const label = fixture.nativeElement.querySelector(
            "label[for='personality-select']",
        ) as HTMLLabelElement;
        expect(label.textContent?.trim()).toBe("Personality");
        expect(select.getAttribute("aria-labelledby")).toBe(
            "personality-select-label",
        );
        expect(optionLabels(select)).toEqual(
            elements.map((element) => element.getName()),
        );
        expect(select.value).toBe(elements[0].getUUID());
        expect(
            fixture.nativeElement
                .querySelector("#active-personality-name")
                .textContent.trim(),
        ).toBe(elements[0].getName());
    });

    it("navigates to the personality chosen in the drop-down", () => {
        navigate.calls.reset();
        const select = personalitySelect(fixture);
        const target = elements[2];

        select.value = target.getUUID();
        select.dispatchEvent(new Event("change"));

        expect(navigate).toHaveBeenCalledWith([target.getUUID(), "chat"], {
            relativeTo: TestBed.inject(ActivatedRoute),
        });
        expect(component.selectedPersonalityId).toBe(target.getUUID());
    });

    it("shows a newly created personality in the drop-down as the selected one", () => {
        const created = new VoiceAssistant(
            "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "Fresh Persona",
            "",
            0,
            "",
        );

        subject.next([...elements, created]);
        fixture.detectChanges();

        const select = personalitySelect(fixture);
        expect(optionLabels(select)).toContain("Fresh Persona");
        expect(select.value).toBe(created.getUUID());
        const selected = Array.from(select.options).find(
            (option) => option.selected,
        );
        expect(selected?.value).toBe(created.getUUID());
        expect(
            fixture.nativeElement
                .querySelector("#active-personality-name")
                .textContent.trim(),
        ).toBe("Fresh Persona");
    });

    it("places labelled person and settings buttons beside the add button", () => {
        component.button = {enabled: true, func: () => undefined};
        fixture.detectChanges();

        const header = fixture.nativeElement.querySelector(
            ".personality-header",
        ) as HTMLElement;
        expect(
            Array.from(header.querySelectorAll("button")).map(
                (button) => button.id,
            ),
        ).toEqual([
            "add-personality-button",
            "personality-description-button",
            "personality-settings-button",
        ]);

        const person = header.querySelector(
            "#personality-description-button",
        ) as HTMLButtonElement;
        const settings = header.querySelector(
            "#personality-settings-button",
        ) as HTMLButtonElement;
        expect(person.getAttribute("aria-label")).toBe(
            "Edit personality description",
        );
        expect(person.getAttribute("title")).toBe(
            "Edit personality description",
        );
        expect(person.querySelector(".bi-person")).not.toBeNull();
        expect(settings.getAttribute("aria-label")).toBe(
            "Personality settings",
        );
        expect(settings.getAttribute("title")).toBe("Personality settings");
        expect(settings.querySelector(".bi-gear")).not.toBeNull();
    });

    it("opens the personality description for editing from the person button", () => {
        const person = fixture.nativeElement.querySelector(
            "#personality-description-button",
        ) as HTMLButtonElement;
        person.click();
        fixture.detectChanges();

        const modal = document.body.querySelector(
            ".modal.cerebra-modal",
        ) as HTMLElement | null;
        expect(modal).not.toBeNull();
        expect(
            modal
                ?.querySelector(".modal-content")
                ?.classList.contains("cerebra-modal"),
        ).toBeFalse();
        const editor = modal?.querySelector(
            "#textarea-personality",
        ) as HTMLTextAreaElement | null;
        expect(editor).not.toBeNull();
        expect(editor?.value).toBe("A written personality");
        expect(
            modal?.querySelector("#voice-assistant-model-select-right-sidebar"),
        ).toBeNull();
    });

    it("opens the shared add/edit dialog for the active personality from the settings button", () => {
        const openEdit = jasmine.createSpy("openEdit");
        component.editButton = {enabled: true, func: openEdit};
        fixture.detectChanges();

        const settings = fixture.nativeElement.querySelector(
            "#personality-settings-button",
        ) as HTMLButtonElement;
        expect(settings.disabled).toBeFalse();
        settings.click();

        expect(openEdit).toHaveBeenCalledWith(
            "01234567-0123-0123-0123-0123456789ab",
        );
        expect(document.body.querySelector(".modal.cerebra-modal")).toBeNull();
    });

    it("leaves the route alone when a personality is edited", () => {
        navigate.calls.reset();
        subject.next([...elements]);
        fixture.detectChanges();

        expect(navigate).not.toHaveBeenCalled();
    });

    it("redirects only when the routed personality is gone", () => {
        navigate.calls.reset();
        const remaining = elements.filter(
            (element) =>
                element.getUUID() !== "01234567-0123-0123-0123-0123456789ab",
        );
        subject.next(remaining);
        fixture.detectChanges();

        expect(navigate).toHaveBeenCalled();
    });
});

function personalitySelect(
    fixture: ComponentFixture<VoiceAssistantNavComponent>,
): HTMLSelectElement {
    const select = fixture.nativeElement.querySelector(
        "#personality-select",
    ) as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    return select as HTMLSelectElement;
}

function optionLabels(select: HTMLSelectElement): string[] {
    return Array.from(select.options).map((option) =>
        (option.textContent ?? "").trim(),
    );
}
