import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
    name: "boolToOnOffPipe",
})
export class BoolToOnOffPipe implements PipeTransform {
    transform(value: boolean): string {
        return value ? "ON" : "OFF";
    }
}
