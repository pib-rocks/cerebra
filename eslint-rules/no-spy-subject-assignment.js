/**
 * Local ESLint rule: a spec must not assign to a property that the same file
 * declares on a jasmine spy.
 *
 * Why (PC-63, PC-64, PC-72): `jasmine.createSpyObj(name, methods, properties)`
 * does not store the third argument's values. It defines a getter and a setter
 * per property, and both are spies - the setter accepts whatever you assign and
 * throws it away. A spec that declares `{modelsSubject: ...}` and later does
 * `spy.modelsSubject = new BehaviorSubject([...])` therefore keeps the OLD
 * subject and keeps passing, while every assertion about that data is vacuous.
 *
 * The rule is deliberately narrow: it only fires when the property name is
 * declared on a spy *in the same file*. Assigning to a subject on a real
 * service instance (chat.service.spec.ts, voice-assistant-chat.component.spec.ts)
 * is legitimate and stays allowed, which a name- or type-based heuristic could
 * not promise.
 */
"use strict";

/** @param {import("estree").MemberExpression} node */
function propertyNameOf(node) {
    if (node.computed) {
        return null;
    }
    if (node.property.type === "Identifier") {
        return node.property.name;
    }
    if (
        node.property.type === "Literal" &&
        typeof node.property.value === "string"
    ) {
        return node.property.value;
    }
    return null;
}

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
                "Disallow assigning to a property that jasmine created as a spy accessor",
        },
        schema: [],
        messages: {
            swallowed:
                "'{{property}}' is declared as a property of a jasmine.createSpyObj in this file, so this assignment is a silent no-op: jasmine installed a setter spy that discards the value. Publish through the existing subject with .next(...), or build the double with createServiceSpy() from src/app/shared/testing/create-service-spy.",
        },
    },

    create(context) {
        /** @type {Set<string>} */
        const declaredOnSpy = new Set();
        /** @type {{property: string, node: import("estree").AssignmentExpression}[]} */
        const assignments = [];

        return {
            CallExpression(node) {
                if (!isCreateSpyObjCall(node) || node.arguments.length < 3) {
                    return;
                }
                const properties = node.arguments[2];
                if (properties.type !== "ObjectExpression") {
                    return;
                }
                for (const property of properties.properties) {
                    if (
                        property.type === "Property" &&
                        !property.computed &&
                        property.key.type === "Identifier"
                    ) {
                        declaredOnSpy.add(property.key.name);
                    }
                }
            },

            AssignmentExpression(node) {
                if (node.left.type !== "MemberExpression") {
                    return;
                }
                const property = propertyNameOf(node.left);
                if (property !== null) {
                    assignments.push({property, node});
                }
            },

            "Program:exit"() {
                for (const {property, node} of assignments) {
                    if (declaredOnSpy.has(property)) {
                        context.report({
                            node,
                            messageId: "swallowed",
                            data: {property},
                        });
                    }
                }
            },
        };
    },
};
