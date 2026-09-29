/**
 * A new personality stores this pointer. Resolving it is a lookup of
 * whichever registry row is currently the default, so changing the default
 * does not rewrite personalities.
 */
export const DEFAULT_PROVIDER_REF = "default";

export interface ProviderCapabilities {
    tools: boolean;
    images: boolean;
    live: boolean;
    stt: boolean;
    tts: boolean;
}

export interface ProviderSelectionRow {
    id: number;
    isDefault: boolean;
    capabilities?: Partial<ProviderCapabilities> | null;
}

export function capabilitiesFrom(
    raw: Partial<ProviderCapabilities> | null | undefined,
    hasImageSupport: boolean,
): ProviderCapabilities {
    const images =
        raw != null && raw.images != null
            ? Boolean(raw.images)
            : Boolean(hasImageSupport);
    return {
        tools: Boolean(raw?.tools),
        images,
        live: Boolean(raw?.live),
        stt: Boolean(raw?.stt),
        tts: Boolean(raw?.tts),
    };
}

export function hasImagesCapability(model: ProviderSelectionRow): boolean {
    return model.capabilities?.images === true;
}

/**
 * Rows a personality may be pointed at. A row without the images capability
 * is not offered. The current reference is kept, disabled, so an existing id
 * is not dropped when the form is saved.
 */
export function providersForSelection<T extends ProviderSelectionRow>(
    models: T[],
    storedRef: string | null,
): T[] {
    const offered = models.filter((model) => hasImagesCapability(model));
    if (storedRef == null || storedRef === DEFAULT_PROVIDER_REF) {
        return offered;
    }
    const current = models.find((model) => String(model.id) === storedRef);
    if (current != null && !hasImagesCapability(current)) {
        return offered.concat([current]);
    }
    return offered;
}

export function providerOptionValue(
    model: ProviderSelectionRow,
    storedRef: string | null,
): string {
    if (
        storedRef != null &&
        storedRef !== DEFAULT_PROVIDER_REF &&
        storedRef === String(model.id)
    ) {
        return storedRef;
    }
    if (model.isDefault) {
        return DEFAULT_PROVIDER_REF;
    }
    return String(model.id);
}

export function providerRefFromSelection(selection: string): {
    providerRef: string;
    assistantModelId: number | null;
} {
    if (selection === DEFAULT_PROVIDER_REF) {
        return {
            providerRef: DEFAULT_PROVIDER_REF,
            assistantModelId: null,
        };
    }
    const id = Number(selection);
    if (!Number.isInteger(id) || id < 1) {
        return {
            providerRef: DEFAULT_PROVIDER_REF,
            assistantModelId: null,
        };
    }
    return {
        providerRef: String(id),
        assistantModelId: id,
    };
}

/** A control is disabled by the selected row's capability flag. */
export function isCapabilityControlDisabled(
    model: ProviderSelectionRow | undefined,
    capability: keyof ProviderCapabilities,
): boolean {
    if (model == null) {
        return true;
    }
    return model.capabilities?.[capability] !== true;
}
