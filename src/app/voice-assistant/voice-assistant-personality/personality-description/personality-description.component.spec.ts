import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PersonalityDescriptionComponent} from "./personality-description.component";

describe("PersonalityDescriptionComponent", () => {
    let component: PersonalityDescriptionComponent;
    let fixture: ComponentFixture<PersonalityDescriptionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PersonalityDescriptionComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PersonalityDescriptionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
