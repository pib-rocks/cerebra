import {ElementRef} from "@angular/core";
import {FormControl} from "@angular/forms";

export interface SliderThumb {
    value: number;
    position: number;
    bubbleFormControl: FormControl<number>;
    inputVisible: boolean;
    bubbleInputElem?: ElementRef;
    id: number;
}