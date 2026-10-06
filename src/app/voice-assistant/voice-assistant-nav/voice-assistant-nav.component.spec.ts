import {ComponentFixture, TestBed} from "@angular/core/testing";

import {VoiceAssistantNavComponent} from "./voice-assistant-nav.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {BoolToOnOffPipe} from "../../shared/pipes/bool-to-on-off-pipe.pipe";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {ActivatedRoute, Router} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";

describe("VoiceAssistantNavComponent", () => {
    let component: VoiceAssistantNavComponent;
    let fixture: ComponentFixture<VoiceAssistantNavComponent>;
    let elements: SidebarElement[];
    let router: Router;
    let subject: BehaviorSubject<SidebarElement[]>;
    let spyOnRouterUrl: jasmine.Spy;
    let navigate: jasmine.Spy;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
                VoiceAssistantNavComponent,
                BoolToOnOffPipe,
            ],
        }).compileComponents();
        router = TestBed.inject(Router);
        elements = [
            new VoiceAssistant(
                "01234567-0123-0123-0123-0123456789ab",
                "123",
                "",
                0,
                "",
            ),
            new VoiceAssistant("223", "223", "", 0, ""),
            new VoiceAssistant("323", "323", "", 0, ""),
            new VoiceAssistant("423", "424", "", 0, ""),
            new VoiceAssistant("525", "525", "", 0, ""),
        ];
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
