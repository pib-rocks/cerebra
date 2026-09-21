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

    it("should return no errors if multiple values are empty", () => {
        formGroup.setValue({field1: "", field2: "", field3: ""});

        const errors: ValidationErrors | null = formGroup.errors;
        expect(errors).toBeNull();
    });

    it("should allow null as input", () => {
        formGroup.setValue({field1: null, field2: null, field3: null});

        const errors: ValidationErrors | null = formGroup.errors;
        expect(errors).toBeNull();
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

    it("should return null if the value is a valid Base58 UID", () => {
        const control = new FormControl("A1b2C3");
        const result = patternOrOptionalValidator()(control);

        expect(result).toBeNull();
    });

    // Tinkerforge UIDs are Base58: 0, O, I and l cannot occur. A stored UID with one of
    // them kills the motors container at import time (PR-1796).
    ["E2E001", "DIFF99", "O12345", "I23456", "l23456"].forEach((invalidUid) => {
        it(`should reject the Base58-invalid UID '${invalidUid}'`, () => {
            const control = new FormControl(invalidUid);

            expect(patternOrOptionalValidator()(control)).toEqual({
                invalidUid: true,
            });
        });
    });

    it("should reject a UID longer than 6 characters", () => {
        const control = new FormControl("ABCDEFG");

        expect(patternOrOptionalValidator()(control)).toEqual({
            invalidUid: true,
        });
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
