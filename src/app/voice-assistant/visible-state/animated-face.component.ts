import {ChangeDetectionStrategy, Component, Input} from "@angular/core";
import {ConversationActivity, IDLE} from "src/app/shared/types/visible-state";

@Component({
    selector: "app-animated-face",
    templateUrl: "./animated-face.component.html",
    styleUrls: ["./animated-face.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class AnimatedFaceComponent {
    @Input() activity: ConversationActivity = IDLE;
    @Input() mouthOpen = false;
}
