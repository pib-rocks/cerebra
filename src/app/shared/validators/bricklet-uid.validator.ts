import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

// Tinkerforge Bricklet UIDs are Base58 encoded, so the characters 0, O, I and l cannot
// occur in a valid UID and must be rejected here (PR-1796). A stored UID with one of them
// makes the motors container fail at import time in pib_motors, which takes the whole motor
// stack down - see the backend counterpart in hardware_config_service.UID_PATTERN.
export const BRICKLET_UID_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{1,6}$/;

export function patternOrOptionalValidator(): ValidatorFn {
    const alNumRegex = BRICKLET_UID_PATTERN;
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }
        return alNumRegex.test(control.value) ? null : {invalidUid: true};
    };
}

export function uniqueValuesValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
        const values = Object.values(formGroup.value).filter(
            (value) => value !== null && value !== "",
        );
        const uniqueValues = new Set(values);

        return values.length === uniqueValues.size || values.length === 0
            ? null
            : {nonUnique: true};
    };
}
