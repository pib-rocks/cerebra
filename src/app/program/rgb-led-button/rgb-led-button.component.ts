import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {ProgramService} from "src/app/shared/services/program.service";
import {RgbLedButtonService} from "src/app/shared/services/rgb-led-button.service";
import {Bricklet} from "src/app/shared/types/bricklet";
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
    ) {}

    ngOnInit(): void {
        this.programs = this.programService.getAllPrograms();

        this.brickletService
            .getBrickletObservable()
            .subscribe((bricklets: Bricklet[]) => {
                console.log(
                    "Received bricklets from BrickletService:",
                    bricklets,
                );

                this.buttons = bricklets.filter(
                    (bricklet) => bricklet.type === "RGB LED Button Bricklet",
                );
                console.log("Filtered buttons:", this.buttons);

                this.buttons.forEach((b) => {
                    if (
                        !this.ledConfigForm.contains(
                            b.brickletNumber.toString(),
                        )
                    ) {
                        this.ledConfigForm.addControl(
                            b.brickletNumber.toString(),
                            new FormControl(null),
                        );
                    }
                });

                this.rgbLedButtonService
                    .getButtonPrograms()
                    .subscribe((buttonPrograms) => {
                        console.log(
                            "ButtonPrograms from backend:",
                            buttonPrograms,
                        );
                        buttonPrograms.forEach((buttonProgram: any) => {
                            const key =
                                buttonProgram.brickletNumber?.toString();
                            if (key && this.ledConfigForm.contains(key)) {
                                this.ledConfigForm
                                    .get(key)
                                    ?.setValue(buttonProgram.programNumber);
                            }
                        });
                        console.log(
                            "FormControls initialized:",
                            this.ledConfigForm.controls,
                        );
                    });
            });
    }

    updateConfig() {
        const buttonProgramValues: any = this.ledConfigForm.value;
        const buttonPrograms = Object.keys(buttonProgramValues).map(
            (brickletNumber) => ({
                brickletNumber: Number(brickletNumber),
                programNumber: buttonProgramValues[brickletNumber] || null,
            }),
        );
        this.rgbLedButtonService
            .updateButtonPrograms(buttonPrograms)
            .subscribe(() => {
                console.log(
                    "Button programs updated successfully:",
                    buttonPrograms,
                );
            });
    }
}
