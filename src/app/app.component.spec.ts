import { TestBed, ComponentFixture } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'cerebra'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual("cerebra");
  });

  it(`the joint control should be open'`, () => {
    const routeInJointControl = "/arm/left";
    component.checkIfThecurrentRouteInJointControlNavItem(routeInJointControl);
    expect(component.isCurrentPathInJointControlNavItem).toBe(true);
  });

  it(`the joint control should be closed''`, () => {
    const routeOutJointControl = "/program";
    component.checkIfThecurrentRouteInJointControlNavItem(routeOutJointControl);
    expect(component.isCurrentPathInJointControlNavItem).toBe(false);
  });
});
