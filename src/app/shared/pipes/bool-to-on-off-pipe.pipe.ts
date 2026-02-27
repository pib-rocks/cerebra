import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
    standalone: false,
    name: "boolToOnOffPipe",
})
export class BoolToOnOffPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? "ON" : "OFF";
    }
}
