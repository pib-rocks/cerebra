import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";

export function compareValuesPulseValidator(
  control1: FormControl,
  control2: FormControl
): ValidatorFn {
  return (formControl: AbstractControl) => {
    if (control1.value >= control2.value) {
      control1.setErrors({ notGreaterThan: true });
      return { notGreaterThan: true };
    } else {
      if (control2.value >= 0 && control1.value >= 0) {
        control1.setErrors(null);
        return null;
      } else {
        control1.setErrors({ error: true });
        return { error: true };
      }
    }
  };
}

export function compareValuesDegreeValidator(
  control1: FormControl,
  control2: FormControl
): ValidatorFn {
  return (formControl: AbstractControl) => {
    if (control1.value >= control2.value) {
      control1.setErrors({ notGreaterThan: true });
      return { notGreaterThan: true };
    } else {
      if (control2.value >= -9000 && control1.value >= -9000) {
        control1.setErrors(null);
        return null;
      } else {
        control1.setErrors({ error: true });
        return { error: true };
      }
    }
  };
}

export function notNullValidator(
  control: AbstractControl
): { [key: string]: any } | null {
  const isNotNull = control.value !== null;
  return isNotNull ? null : { nullValue: true };
}

export function steppingValidator(step : number) : ValidatorFn
{
  return (formControl : AbstractControl) => {
    if(Number.parseInt(formControl.value) % step){
      return {steppingError : true};
    }else{
      return null;
    }
  }
}
