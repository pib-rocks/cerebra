/**
 * A new personality stores this pointer. Resolving it is a lookup of
 * whichever model row is currently the default, so changing the default
 * does not rewrite personalities. The provider follows from that model.
 */
export const DEFAULT_PROVIDER_REF = "default";

/**
 * Registry row whose credential is the SmartConnect token. The Speech tab
 * shows that token as pib.Cloud and does not ask for a second key.
 * A personality on this row needs no provider key.
 */
export const CLOUD_TOKEN_API_NAME = "pib-cloud";

export const MISSING_KEY_MARK = "Needs a key";

export const MISSING_KEY_TURN =
    "This personality needs a provider key. It is marked until a key is stored in the Speech tab.";

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
    apiName?: string;
    visualName?: string;
    capabilities?: Partial<ProviderCapabilities> | null;
    credentialRef?: string | null;
    /** Set by the catalogue. A retired row is kept so a personality can be named, not chosen. */
    retired?: boolean;
    /** Account this model belongs to. Absent when the row is its own provider. */
    providerId?: number | null;
    providerName?: string | null;
    endpointBase?: string | null;
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

export function usesCloudToken(model: ProviderSelectionRow): boolean {
    return model.apiName === CLOUD_TOKEN_API_NAME;
}

/** A pasted key, or the SmartConnect token for the pib.Cloud row. */
export function isProviderConfigured(
    model: ProviderSelectionRow,
    cloudTokenStored: boolean,
): boolean {
    if (usesCloudToken(model)) {
        return cloudTokenStored;
    }
    return model.credentialRef != null && model.credentialRef !== "";
}

export function isRetired(model: ProviderSelectionRow): boolean {
    return model.retired === true;
}

/** Names the catalogue row that is gone and asks for a replacement. */
export function retiredModelNotice(model: ProviderSelectionRow): string {
    const name =
        model.visualName?.trim() || model.apiName?.trim() || "This model";
    return `${name} is gone. Choose a new one.`;
}

export function isProviderOptionDisabled(
    model: ProviderSelectionRow,
    cloudTokenStored: boolean,
): boolean {
    return (
        isRetired(model) ||
        isCapabilityControlDisabled(model, "images") ||
        !isProviderConfigured(model, cloudTokenStored)
    );
}

export function resolveProvider<T extends ProviderSelectionRow>(
    providerRef: string | null | undefined,
    models: T[],
): T | null {
    if (
        providerRef == null ||
        providerRef === "" ||
        providerRef === DEFAULT_PROVIDER_REF
    ) {
        return models.find((model) => model.isDefault) ?? null;
    }
    return models.find((model) => String(model.id) === providerRef) ?? null;
}

export interface PersonalityAttention {
    reason: "retired" | "missing-key";
    notice: string;
}

/**
 * Why a personality needs attention, or null when its provider is usable.
 * An empty model list means the catalogue has not loaded, so a missing key
 * is not marked. needsNewModel still is: the API already reported the row
 * retired. A loaded retired row is named from the catalogue. The selection
 * is not rewritten.
 */
export function personalityAttention(
    providerRef: string | null | undefined,
    models: ProviderSelectionRow[],
    cloudTokenStored: boolean,
    needsNewModel = false,
): PersonalityAttention | null {
    if (models.length === 0) {
        if (needsNewModel) {
            return {
                reason: "retired",
                notice: retiredModelNotice({id: 0, isDefault: false}),
            };
        }
        return null;
    }
    const model = resolveProvider(providerRef, models);
    if (model != null && isRetired(model)) {
        return {reason: "retired", notice: retiredModelNotice(model)};
    }
    if (needsNewModel && model == null) {
        return {
            reason: "retired",
            notice: retiredModelNotice({id: 0, isDefault: false}),
        };
    }
    if (model == null || !isProviderConfigured(model, cloudTokenStored)) {
        return {reason: "missing-key", notice: MISSING_KEY_MARK};
    }
    return null;
}

/**
 * True when the personality still points at a provider whose key is gone,
 * or at a catalogue row that has been retired.
 * An empty model list means the registry has not loaded, so a missing key
 * is not marked. needsNewModel is still marked.
 */
export function personalityNeedsAttention(
    providerRef: string | null | undefined,
    models: ProviderSelectionRow[],
    cloudTokenStored: boolean,
    needsNewModel = false,
): boolean {
    return (
        personalityAttention(
            providerRef,
            models,
            cloudTokenStored,
            needsNewModel,
        ) != null
    );
}

/**
 * Rows a personality may be pointed at. Retired rows are not offered for a
 * new selection. A row without the images capability is not offered, and
 * neither is a row with no stored key. The current reference is kept so an
 * existing id is not dropped when the form is saved.
 */
export function providersForSelection<T extends ProviderSelectionRow>(
    models: T[],
    storedRef: string | null,
    cloudTokenStored = false,
): T[] {
    const offered = models.filter(
        (model) =>
            !isRetired(model) &&
            hasImagesCapability(model) &&
            isProviderConfigured(model, cloudTokenStored),
    );
    const current = currentSelection(models, storedRef);
    if (current != null && !offered.includes(current)) {
        return offered.concat([current]);
    }
    return offered;
}

function currentSelection<T extends ProviderSelectionRow>(
    models: T[],
    storedRef: string | null,
): T | null {
    if (storedRef == null) {
        return null;
    }
    if (storedRef === DEFAULT_PROVIDER_REF) {
        return models.find((model) => model.isDefault) ?? null;
    }
    return models.find((model) => String(model.id) === storedRef) ?? null;
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

const CAPABILITY_KEYS: (keyof ProviderCapabilities)[] = [
    "tools",
    "images",
    "live",
    "stt",
    "tts",
];

/**
 * Flags that are true on every model of one provider.
 * One model means its own flags. A provider with none stores every flag off.
 */
export function capabilitiesHeldByAll(
    rows: ReadonlyArray<Partial<ProviderCapabilities> | null | undefined>,
): ProviderCapabilities {
    if (rows.length === 0) {
        return {
            tools: false,
            images: false,
            live: false,
            stt: false,
            tts: false,
        };
    }
    const shared: ProviderCapabilities = {
        tools: true,
        images: true,
        live: true,
        stt: true,
        tts: true,
    };
    for (const row of rows) {
        for (const key of CAPABILITY_KEYS) {
            shared[key] = shared[key] && row?.[key] === true;
        }
    }
    return shared;
}

/** The provider of a model. A row without one is its own provider. */
export function providerIdOf(model: {
    id: number;
    providerId?: number | null;
}): number {
    if (model.providerId != null && model.providerId > 0) {
        return model.providerId;
    }
    return model.id;
}

export interface RegistryProviderRecord {
    id: number;
    name: string;
    endpointBase?: string | null;
    capabilities?: Partial<ProviderCapabilities> | null;
    credentialRef?: string | null;
}

export type ModelWithProvider<T> = T & {
    providerId: number;
    providerName: string | null;
    credentialRef: string | null;
    endpointBase: string | null;
};

/**
 * The credential and the endpoint live on the provider. The model's own
 * flags stay on the model.
 */
export function attachProvider<
    T extends {
        id: number;
        providerId?: number | null;
        credentialRef?: string | null;
        endpointBase?: string | null;
        providerName?: string | null;
    },
>(
    model: T,
    providers: readonly RegistryProviderRecord[],
): ModelWithProvider<T> {
    const provider = providers.find((row) => row.id === model.providerId);
    if (provider == null) {
        return {
            ...model,
            providerId: providerIdOf(model),
            providerName: model.providerName ?? null,
            credentialRef: model.credentialRef ?? null,
            endpointBase: model.endpointBase ?? null,
        };
    }
    return {
        ...model,
        providerId: provider.id,
        providerName: provider.name,
        credentialRef: provider.credentialRef ?? null,
        endpointBase: provider.endpointBase ?? null,
    };
}

/** One key card. Several models of one provider share it. */
export interface ProviderKeyAccount {
    id: number;
    name: string;
    endpointBase: string | null;
    credentialRef: string | null;
    capabilities: ProviderCapabilities;
    modelIds: number[];
}

export function providerKeyAccounts<T extends ProviderSelectionRow>(
    models: readonly T[],
): ProviderKeyAccount[] {
    const groups = new Map<number, T[]>();
    for (const model of models) {
        const id = providerIdOf(model);
        const group = groups.get(id);
        if (group == null) {
            groups.set(id, [model]);
        } else {
            group.push(model);
        }
    }
    const accounts: ProviderKeyAccount[] = [];
    for (const [id, group] of groups) {
        accounts.push({
            id,
            name: providerAccountName(group),
            endpointBase: sharedEndpoint(group),
            credentialRef: sharedCredential(group),
            capabilities: capabilitiesHeldByAll(
                group.map((model) => model.capabilities),
            ),
            modelIds: group.map((model) => model.id),
        });
    }
    return accounts;
}

function providerAccountName(group: readonly ProviderSelectionRow[]): string {
    const named = group.find(
        (model) =>
            model.providerName != null && model.providerName.trim() !== "",
    );
    if (named?.providerName != null && named.providerName.trim() !== "") {
        return named.providerName.trim();
    }
    if (group.length === 1) {
        return (
            group[0].visualName?.trim() ||
            group[0].apiName?.trim() ||
            "Provider"
        );
    }
    const labels = group
        .map((model) => model.visualName?.trim() || model.apiName?.trim())
        .filter((label): label is string => label != null && label !== "");
    return labels.join(", ") || "Provider";
}

function sharedEndpoint(group: readonly ProviderSelectionRow[]): string | null {
    const endpoint = group.find(
        (model) => model.endpointBase != null && model.endpointBase !== "",
    );
    return endpoint?.endpointBase ?? null;
}

function sharedCredential(
    group: readonly ProviderSelectionRow[],
): string | null {
    const credential = group.find(
        (model) => model.credentialRef != null && model.credentialRef !== "",
    );
    return credential?.credentialRef ?? null;
}

/** The stored reference is a model id. The provider follows from that model. */
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
