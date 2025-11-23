export function makeChannels<T extends readonly string[]>(
  feature: string,
  actions: T
) {
  type Action = T[number];
  const out = {} as Record<Action, string>;

  for (const action of actions as readonly Action[]) {
    const kebab = action.toLowerCase().replace(/_/g, "-");
    out[action] = `${feature}:${kebab}`;
  }
  return out;
}

// Example usage
export const CHANNELS = {
  FILES: makeChannels("files", [
    "PICK_FOLDER",
    "READ_FILE",
    "WRITE_FILE",
  ] as const),
  AUTH: makeChannels("auth", ["LOGIN", "LOGOUT", "ME"] as const),
  DATABASE: makeChannels("database", ["PING"] as const),
  CUSTOMERS: makeChannels("customers", ["LIST", "OVERVIEW", "DETAIL"] as const),
  PRODUCTS: makeChannels("products", ["LIST", "OVERVIEW", "DETAIL"] as const),
  SUPPLIERS: makeChannels("suppliers", ["LIST", "DETAIL", "OVERVIEW"] as const),
} as const;

// Types
export type Channel =
  | (typeof CHANNELS.FILES)[keyof typeof CHANNELS.FILES]
  | (typeof CHANNELS.AUTH)[keyof typeof CHANNELS.AUTH]
  | (typeof CHANNELS.DATABASE)[keyof typeof CHANNELS.DATABASE]
  | (typeof CHANNELS.CUSTOMERS)[keyof typeof CHANNELS.CUSTOMERS]
  | (typeof CHANNELS.PRODUCTS)[keyof typeof CHANNELS.PRODUCTS]
  | (typeof CHANNELS.SUPPLIERS)[keyof typeof CHANNELS.SUPPLIERS];
