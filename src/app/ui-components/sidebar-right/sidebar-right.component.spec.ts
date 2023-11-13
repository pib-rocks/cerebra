import {ComponentFixture, TestBed} from "@angular/core/testing";

import {SideBarRightComponent} from "./sidebar-right.component";
import {RouterTestingModule} from "@angular/router/testing";

describe("SideBarRightComponent", () => {
    let component: SideBarRightComponent;
    let fixture: ComponentFixture<SideBarRightComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SideBarRightComponent],
            imports: [RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(SideBarRightComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
