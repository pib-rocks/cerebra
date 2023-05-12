import {
  ComponentFixture,
  TestBed,
  tick,
  fakeAsync,
} from "@angular/core/testing";
import {
  FormControl,
  ReactiveFormsModule,
  FormControlDirective,
} from "@angular/forms";
import { By } from "@angular/platform-browser";
import { CameraComponent } from "./camera.component";

describe("CameraComponent", () => {
  let component: CameraComponent;
  let fixture: ComponentFixture<CameraComponent>;
  let formControl: FormControl;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [CameraComponent],
      imports: [ReactiveFormsModule],
      providers: [FormControlDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraComponent);
    component = fixture.componentInstance;
    formControl = component.refreshRateControl;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
