import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup} from "@angular/forms";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Observable} from "rxjs";
import {take, switchMap, filter} from "rxjs/operators";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {ProgramService} from "src/app/shared/services/program.service";
import {RgbLedButtonService} from "src/app/shared/services/rgb-led-button.service";
import {RosService} from "src/app/shared/services/ros-service/ros.service";
import {Bricklet} from "src/app/shared/types/bricklet";
import {ButtonProgram} from "src/app/shared/types/button-program";
import {Program} from "src/app/shared/types/program";

@Component({
    selector: "app-rgb-led-button",
    templateUrl: "./rgb-led-button.component.html",
    styleUrl: "./rgb-led-button.component.scss",
})
export class RgbLedButtonComponent implements OnInit {
    buttons: Bricklet[] = [];
    programs!: Observable<Program[]>;

    ledConfigForm = new FormGroup({});

    constructor(
        private programService: ProgramService,
        private rgbLedButtonService: RgbLedButtonService,
        private brickletService: BrickletService,
        private snackBar: MatSnackBar,
        private rosService: RosService,
    ) {}

    ngOnInit(): void {
        this.programs = this.programService.getAllPrograms();

        this.brickletService
            .getBrickletObservable()
            .pipe(
                filter((bricklets) => bricklets.length > 0),
                take(1),
                switchMap((bricklets: Bricklet[]) => {
                    this.buttons = bricklets.filter(
                        (b) => b.type === "RGB LED Button Bricklet",
                    );
                    this.buttons.forEach((button) => {
                        const key = String(button.brickletNumber);
                        if (!this.ledConfigForm.contains(key)) {
                            this.ledConfigForm.addControl(
                                key,
                                new FormControl<string | null>(null),
                            );
                        }
                    });
                    return this.rgbLedButtonService.getButtonPrograms();
                }),
            )
            .subscribe((buttonPrograms: ButtonProgram[]) => {
                buttonPrograms.forEach((bp) => {
                    const key = String(bp.brickletNumber);
                    if (this.ledConfigForm.contains(key)) {
                        this.ledConfigForm.get(key)?.setValue(bp.programNumber);
                    }
                });
            });
    }

    updateConfig() {
        const buttonPrograms: ButtonProgram[] = Object.keys(
            this.ledConfigForm.controls,
        ).map((brickletNumber) => ({
            brickletNumber: Number(brickletNumber),
            programNumber:
                this.ledConfigForm.get(brickletNumber)?.value || null,
        }));
        this.rgbLedButtonService
            .updateButtonPrograms(buttonPrograms)
            .subscribe({
                next: () => {
                    this.ledConfigForm.markAsPristine();
                    this.snackBar.open(
                        "Button programs updated successfully",
                        "",
                        {
                            panelClass: "cerebra-toast",
                            duration: 3000,
                        },
                    );
                },
                error: () =>
                    this.snackBar.open("Error updating button programs", "", {
                        panelClass: "cerebra-toast",
                        duration: 3000,
                    }),
            });
    }
    changeButtonColor(uid: string) {
        this.rosService.setButtonColor(uid, 0, 0, 255);
    }
}
