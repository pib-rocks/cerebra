import {Subject} from "rxjs";
import {Message} from "./message";
//Remove in PR-318
export interface Motor {
    motor: string;
    receiver$: Subject<Message>;
}
