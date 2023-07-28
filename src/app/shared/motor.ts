import {Subject} from "rxjs"
import {Message} from "./message"

export interface Motor {
    motor: string
    receiver$: Subject<Message>
}
