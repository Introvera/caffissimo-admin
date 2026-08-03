/**
 * Central barrel — import this file anywhere you need to use RTK Query hooks.
 * All slices inject into the shared baseApi, so importing them here ensures
 * they are registered before first use.
 */

// Existing slices
export * from "./branchApi";
export * from "./productApi";
export * from "./toppingApi";
export * from "./variantApi";
export * from "./orderApi";

// New slices
export * from "./offerApi";
export * from "./userApi";
export * from "./branchProductApi";
export * from "./uberMenuApi";
export * from "./orderItemApi";
export * from "./specialDayApi";

