import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RosService } from '../shared/ros.service';

import { VoiceAssistantComponent } from './voice-assistant.component';

describe('VoiceAssistantComponent', () => {
  let component: VoiceAssistantComponent;
  let fixture: ComponentFixture<VoiceAssistantComponent>;
  let rosService: RosService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoiceAssistantComponent ],
      imports: [ReactiveFormsModule],
      providers: [ RosService ]

    })
    .compileComponents();
    fixture = TestBed.createComponent(VoiceAssistantComponent);
    component = fixture.componentInstance;
    rosService = TestBed.inject(RosService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the personality and threshold on clicking the button', () => {
    const updateBtn = fixture.debugElement.query(By.css('#updateBtn'));
    spyOn(component,'updateVoiceSettings').and.callThrough();
    spyOn(rosService, 'sendMessage');
    component.voiceFormGroup.get('personality')?.setValue('test');
    component.voiceFormGroup.get('threshold')?.setValue(1.5);
    component.voiceFormGroup.get('gender')?.setValue('male');
    updateBtn.nativeElement.click();
    expect(component.updateVoiceSettings).toHaveBeenCalled();
    expect(rosService.sendMessage).toHaveBeenCalledWith({
      personality: 'test',
      threshold: 1.5,
      gender: 'male'
    });
    expect(component.voiceFormGroup.get('personality')?.value).toBe('');
  });


  it('should send activation flag true/false when checking the checkbox', () => {
    spyOn(component, 'sendVoiceActivationFlag').and.callThrough();
    spyOn(rosService, 'sendMessage');
    const checkbox = fixture.debugElement.query(By.css('#checkbox'));
    checkbox.nativeElement.dispatchEvent(new Event('change'));
    expect(component.sendVoiceActivationFlag).toHaveBeenCalled();
    expect(rosService.sendMessage).toHaveBeenCalled();
  });





 it('should not send the values to the server when the form is invalid and inform the user about the error', () => {
  spyOn(component,'updateVoiceSettings').and.callThrough();
  spyOn(rosService, 'sendMessage');
  component.voiceFormGroup.get('personality')?.setValue('test');
  component.voiceFormGroup.get('gender')?.setValue('male');
  component.voiceFormGroup.get('threshold')?.setValue(8);  
  const updateBtn = fixture.debugElement.query(By.css('#updateBtn'));
  updateBtn.nativeElement.click();
  fixture.detectChanges();
  const compiled = fixture.debugElement.nativeElement;
  expect(component.updateVoiceSettings).toHaveBeenCalled();
  expect(rosService.sendMessage).not.toHaveBeenCalled();
  expect(compiled.querySelector('span').textContent).toContain("threshhold must be between 0.1 and 2");
 })



});