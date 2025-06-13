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
        if (!this.brickletUidForm.valid) return;
        const newBrickletInput: Record<number, string> =
            this.brickletUidForm.getRawValue();
        const changedBricklets: Bricklet[] =
            this.detectChangedBricklets(newBrickletInput);

        if (changedBricklets.length > 0) {
            this.brickletService.renameBrickletUid(changedBricklets);
        }
    }

    private detectChangedBricklets(
        newBrickletInput: Record<number, string>,
    ): Bricklet[] {
        return Object.entries(newBrickletInput)
            .map(([key, value]) => {
                const brickletNumber = Number(key);
                const existingBricklet =
                    this.brickletService.getBricklet(brickletNumber);
                if (existingBricklet && existingBricklet.uid !== value) {
                    return new Bricklet(
                        value,
                        Number(key),
                        existingBricklet.type,
                    );
                }
                return null;
            })
            .filter((bricklet) => bricklet !== null) as Bricklet[];
    }
}
