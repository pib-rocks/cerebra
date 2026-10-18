/**
 * Local ESLint rule: specs must not declare properties through jasmine's third
 * createSpyObj argument.
 *
 * Why (PC-63, PC-64, PC-72): that argument does not store values. Jasmine
 * defines a getter and a setter per property, and both are spies - the setter
 * accepts an assignment and discards it, so a spec that later replaces such a
 * property keeps the old value and stays green while asserting nothing.
 * `createServiceSpy()` (src/app/shared/testing) does the same job with ordinary
 * writable fields, which is why it is the only supported path.
 *
 * After the PC-72 rollout there is no legitimate use left in the suite: the one
 * remaining call site (the helper's own spec) documents the hazard on purpose
 * and carries an inline disable with its reason.
 */
"use strict";

/** @param {import("estree").CallExpression} node */
function isCreateSpyObjCall(node) {
    const callee = node.callee;
    return (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        callee.object.name === "jasmine" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "createSpyObj"
    );
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow declaring spy properties through jasmine.createSpyObj's third argument",
        },
        schema: [],
        messages: {
            forbidden:
                "jasmine.createSpyObj's third argument declares properties as spy accessors whose setter silently discards assignments, so a later assignment is a no-op. Build the double with createServiceSpy() from src/app/shared/testing/create-service-spy and pass the properties there.",
        },
    },

    create(context) {
        return {
            CallExpression(node) {
                if (isCreateSpyObjCall(node) && node.arguments.length >= 3) {
                    context.report({node, messageId: "forbidden"});
                }
            },
        };
    },
};
