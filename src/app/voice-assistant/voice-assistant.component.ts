import { Component} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RosService } from '../shared/ros.service';
import { VoiceAssistant } from '../shared/voice-assistant';

@Component({
  selector: 'app-voice-assistant',
  templateUrl: './voice-assistant.component.html',
  styleUrls: ['./voice-assistant.component.css']
})
export class VoiceAssistantComponent{

  voiceFormGroup: FormGroup = new FormGroup({
    personality: new FormControl(''),
    threshold: new FormControl(0.8, [Validators.min(0),Validators.required]),
    gender: new FormControl('male')
  });


  activationFlag: FormControl = new FormControl(false);

  constructor(private rosService: RosService){}


  updateVoiceSettings(){

    console.log(this.voiceFormGroup.value);
    if (this.voiceFormGroup.valid){
      const msg: VoiceAssistant = {
        personality: this.voiceFormGroup.get('personality')?.value,
        threshold: this.voiceFormGroup.get('threshold')?.value,
        gender: this.voiceFormGroup.get('gender')?.value
      }
      console.log(this.rosService);
      this.rosService.sendMessage(msg);
      this.voiceFormGroup.get('personality')?.setValue('');
    }


  }

  sendVoiceActivationFlag(){
    const msg: VoiceAssistant = {
      activationFlag: this.activationFlag.value
    }
    this.rosService.sendMessage(msg);
  }



}
