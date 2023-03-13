import { AbstractControl, FormControl, ValidatorFn } from "@angular/forms";

export function compareValuesValidator(control1: FormControl, control2: FormControl): ValidatorFn {
    return (formControl: AbstractControl) => {
  
      if (control1.value >= control2.value) {
        control1.setErrors({ 'notGreaterThan': true });
        return { 'notGreaterThan': true };
      } else {
        control1.setErrors(null);
        return null;
      }
    };
}