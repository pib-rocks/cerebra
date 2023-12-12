import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PersonalityWrapperComponent} from "./personality-wrapper.component";

describe("PersonalityWrapperComponent", () => {
    let component: PersonalityWrapperComponent;
    let fixture: ComponentFixture<PersonalityWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PersonalityWrapperComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PersonalityWrapperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
