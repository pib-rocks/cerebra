import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { RosService } from "../shared/ros.service";
import { VoiceAssistant } from "../shared/voice-assistant";

@Component({
  selector: "app-voice-assistant",
  templateUrl: "./voice-assistant.component.html",
  styleUrls: ["./voice-assistant.component.css"],
})
export class VoiceAssistantComponent implements OnInit {
  voiceFormGroup: FormGroup = new FormGroup({
    personality: new FormControl(""),
    threshold: new FormControl(0.8, [Validators.min(0), Validators.required]),
    gender: new FormControl("male"),
  });
  activationFlag: FormControl = new FormControl(false);
  constructor(private rosService: RosService) {}
  ngOnInit(): void {
    this.rosService.voiceAssistantReceiver$.subscribe((value) => {
      this.activationFlag.setValue(JSON.parse(value)[0].activationFlag);
    });
  }

  updateVoiceSettings() {
    if (this.voiceFormGroup.valid) {
      const msg: VoiceAssistant = {
        personality: this.voiceFormGroup.get("personality")?.value,
        threshold: this.voiceFormGroup.get("threshold")?.value,
        gender: this.voiceFormGroup.get("gender")?.value,
      };
      this.rosService.sendSliderMessage(msg);
      this.voiceFormGroup.get("personality")?.setValue("");
    }
  }

  sendVoiceActivationFlag() {
    const msg: VoiceAssistant = {
      activationFlag: this.activationFlag.value,
    };
    this.rosService.sendSliderMessage(msg);
  }
}
