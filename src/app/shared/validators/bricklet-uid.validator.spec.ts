import {FormGroup, FormControl, ValidationErrors} from "@angular/forms";
import {
    uniqueValuesValidator,
    patternOrOptionalValidator,
} from "./bricklet-uid.validator";

describe("uniqueValuesValidator", () => {
    let formGroup: FormGroup;

    beforeEach(() => {
        formGroup = new FormGroup(
            {
                field1: new FormControl(""),
                field2: new FormControl(""),
                field3: new FormControl(""),
            },
            {validators: [uniqueValuesValidator()]},
        );
    });

    it("should return no errors if all values are unique", () => {
        formGroup.setValue({field1: "A", field2: "B", field3: ""});

        const errors: ValidationErrors | null = formGroup.errors;
        expect(errors).toBeNull();
    });

    it("should return an error if duplicate values exist", () => {
        formGroup.setValue({field1: "A", field2: "B", field3: "B"});

        const errors: ValidationErrors | null = formGroup.errors;
        expect(errors).toEqual({nonUnique: true});
    });

    it("should return an error if multiple values are empty", () => {
        formGroup.setValue({field1: "", field2: "", field3: ""});

        const errors: ValidationErrors | null = formGroup.errors;
        expect(errors).toEqual({nonUnique: true});
    });

    it("should allow null as input", () => {
        formGroup.setValue({field1: null, field2: null, field3: null});

        const errors: ValidationErrors | null = formGroup.errors;
        expect(errors).toEqual({nonUnique: true});
    });
});

describe("patternOrOptionalValidator", () => {
    it("should return null if the value is empty", () => {
        const control = new FormControl("");
        const result = patternOrOptionalValidator()(control);

        expect(result).toBeNull();
    });

    it("should return null if the value is optional and empty", () => {
        const control = new FormControl(null);
        const result = patternOrOptionalValidator()(control);

        expect(result).toBeNull();
    });

    it("should return null if the value matches the alphanumeric pattern", () => {
        const control = new FormControl("Valid123");
        const result = patternOrOptionalValidator()(control);

        expect(result).toBeNull();
    });

    it("should return an error if the value does not match the alphanumeric pattern", () => {
        const control = new FormControl("Invalid!@#");
        const result = patternOrOptionalValidator()(control);

        expect(result).toEqual({invalidUid: true});
    });

    it("should return null if the value is only numeric", () => {
        const control = new FormControl("123456");
        const result = patternOrOptionalValidator()(control);

        expect(result).toBeNull();
    });

    it("should return null if the value is only alphabetic", () => {
        const control = new FormControl("abcdef");
        const result = patternOrOptionalValidator()(control);

        expect(result).toBeNull();
    });
});
