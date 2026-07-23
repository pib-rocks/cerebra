import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PersonalityWrapperComponent} from "./personality-wrapper.component";
import {RouterTestingModule} from "@angular/router/testing";

describe("PersonalityWrapperComponent", () => {
    let component: PersonalityWrapperComponent;
    let fixture: ComponentFixture<PersonalityWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, PersonalityWrapperComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PersonalityWrapperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
