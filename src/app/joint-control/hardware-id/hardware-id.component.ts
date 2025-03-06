import {Component, OnInit} from "@angular/core";
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from "@angular/forms";
import {Observable} from "rxjs";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {Bricklet} from "src/app/shared/types/bricklet";

@Component({
    selector: "app-hardware-id",
    templateUrl: "./hardware-id.component.html",
    styleUrl: "./hardware-id.component.scss",
})
export class HardwareIdComponent implements OnInit {
    bricklets!: Observable<Bricklet[]>;

    brickletUidForm = new FormGroup(
        {},
        {validators: this.uniqueValuesValidator()},
    );

    constructor(private brickletService: BrickletService) {}

    ngOnInit(): void {
        this.bricklets = this.brickletService.getBrickletObservable();
        this.bricklets.subscribe((bricklets) => {
            bricklets.forEach((bricklet) => {
                this.brickletUidForm.addControl(
                    bricklet.brickletNumber.toString(),
                    new FormControl(bricklet.uid, [
                        Validators.maxLength(6),
                        this.patternOptionalValidator(
                            new RegExp("^[a-zA-Z0-9]+$"),
                        ),
                    ]),
                );
            });
        });
    }

    updateIds() {
        console.log("update IDs");
        if (this.brickletUidForm.valid) {
            const newBrickletInput: Record<number, string> =
                this.brickletUidForm.getRawValue();
            console.log(newBrickletInput);
            const newBricklets: Bricklet[] = Object.entries(
                newBrickletInput,
            ).map(([key, value]) => ({
                uid: value,
                brickletNumber: Number(key),
            }));
            newBricklets.map((bricklet) => {
                if (bricklet.uid) {
                    this.brickletService.renameBrickletUid(
                        bricklet.uid,
                        bricklet.brickletNumber,
                    );
                }
            });
        }
    }

    patternOptionalValidator(pattern: RegExp): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }
            return pattern.test(control.value) ? null : {patternInvalid: true};
        };
    }

    uniqueValuesValidator(): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const values = Object.values(formGroup.value);
            const uniqueValues = new Set(values);

            return values.length === uniqueValues.size
                ? null
                : {nonUnique: true};
        };
    }
}
