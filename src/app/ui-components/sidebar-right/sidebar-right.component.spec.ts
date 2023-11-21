import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from "@angular/core/testing";

import {SideBarRightComponent} from "./sidebar-right.component";
import {RouterTestingModule} from "@angular/router/testing";
import {BehaviorSubject} from "rxjs";
import {SidebarElement} from "src/app/shared/interfaces/sidebar-element.interface";
import {VoiceAssistant} from "src/app/shared/types/voice-assistant";
import {ActivatedRoute, Router} from "@angular/router";

describe("SideBarRightComponent", () => {
    let component: SideBarRightComponent;
    let fixture: ComponentFixture<SideBarRightComponent>;
    const testSubject = new BehaviorSubject<SidebarElement[]>([
        new VoiceAssistant("123", "Test", "Male", 0.8, ""),
    ]);
    let router: Router;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SideBarRightComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {},
                },
            ],
            imports: [RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(SideBarRightComponent);
        router = TestBed.inject(Router);
        component = fixture.componentInstance;
        component.subject = testSubject;
        component.lStorage = "temp";
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should assume new values when subscribed Observable emits new value", fakeAsync(() => {
        component.ngOnInit();
        tick(200);
        expect(component.sidebarElements.length).toBe(1);
        testSubject.next([
            new VoiceAssistant("321", "ABC", "Female", 0.3),
            new VoiceAssistant("322", "ADC", "Female", 0.4),
        ]);
        expect(component.sidebarElements.length).toBe(2);
    }));
});
