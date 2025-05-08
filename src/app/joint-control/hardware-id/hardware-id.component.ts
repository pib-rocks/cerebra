import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Observable} from "rxjs";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {Bricklet} from "src/app/shared/types/bricklet";
import {
    patternOrOptionalValidator,
    uniqueValuesValidator,
} from "src/app/shared/validators/bricklet-uid.validator";

@Component({
    selector: "app-hardware-id",
    templateUrl: "./hardware-id.component.html",
    styleUrl: "./hardware-id.component.scss",
})
export class HardwareIdComponent implements OnInit {
    bricklets!: Observable<Bricklet[]>;

    brickletUidForm = new FormGroup({}, {validators: uniqueValuesValidator()});

    constructor(private brickletService: BrickletService) {}

    ngOnInit(): void {
        this.bricklets = this.brickletService.getBrickletObservable();
        this.bricklets.subscribe((bricklets) => {
            bricklets.forEach((bricklet) => {
                this.brickletUidForm.addControl(
                    bricklet.brickletNumber.toString(),
                    new FormControl(bricklet.uid, [
                        Validators.maxLength(6),
                        patternOrOptionalValidator(),
                    ]),
                );
            });
        });
    }

    updateIds() {
        if (this.brickletUidForm.valid) {
            const newBrickletInput: Record<number, string> =
                this.brickletUidForm.getRawValue();

            const newBricklets: Bricklet[] = Object.entries(
                newBrickletInput,
            ).map(([key, value]) => {
                const bricklet = this.brickletService.getBricklet(Number(key));
                return new Bricklet(value, Number(key), bricklet?.type || "");
            });
            this.brickletService.renameBrickletUid(newBricklets);
        }
    }
}
