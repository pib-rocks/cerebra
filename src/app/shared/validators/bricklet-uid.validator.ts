import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export function patternOrOptionalValidator(): ValidatorFn {
    const alNumRegex = /^[a-zA-Z0-9]+$/;
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
