import { z } from 'zod';

export const AddItemSchema = z.object({
  item_id:  z.string().describe('Exact menu item ID from the menu'),
  quantity: z.number().int().min(1).max(20),
  notes:    z.string().optional().describe('Special instructions e.g. extra spicy'),
});

export const RemoveItemSchema = z.object({
  item_id:  z.string(),
  quantity: z.number().int().min(1).optional()
    .describe('If omitted, removes all of this item'),
});

export const UpdateQuantitySchema = z.object({
  item_id:      z.string(),
  new_quantity: z.number().int().min(0)
    .describe('0 means remove entirely. Use absolute value, not delta.'),
});

export const ClarifySchema = z.object({
  question: z.string().describe('The clarifying question to ask the user'),
  options:  z.array(z.string()).optional()
    .describe('Quick-reply options to surface as chips'),
});

export const SuggestPairingSchema = z.object({
  item_ids: z.array(z.string()).min(1).max(3)
    .describe('IDs of items to suggest as pairings'),
  reason: z.string().max(100)
    .describe("One-line reason e.g. 'goes great with your burger'"),
});

export const ClearCartSchema = z.object({
  confirm: z.boolean().describe('Must be true to confirm clearing'),
});

export const UpsellSchema = z.object({
  item_id: z.string(),
  pitch:   z.string().max(80),
});

export const UpdateNotesSchema = z.object({
  item_id: z.string().describe('Exact menu item ID already in the cart'),
  notes:   z.string().describe('Special preparation instructions for this item. Empty string clears existing notes.'),
});

export const AskCustomizationSchema = z.object({
  item_id: z.string().describe('The exact menu item ID (e.g. "spicy-chicken-sandwich"). The app resolves the cart line automatically — never pass a line_id.'),
  prompt:  z.string().max(120).describe('Short prompt shown to the user, e.g. "How would you like your burger?"'),
});

function toInputSchema(schema: z.ZodType): Record<string, unknown> {
  // Zod v4 built-in JSON schema conversion
  const full = z.toJSONSchema(schema) as Record<string, unknown>;
  const { $schema, ...rest } = full as any;
  return rest;
}

export const BISTRO_TOOLS = [
  {
    name: 'add_item',
    description: 'Add one or more of a menu item to the cart.',
    input_schema: toInputSchema(AddItemSchema),
  },
  {
    name: 'remove_item',
    description: 'Remove an item from the cart.',
    input_schema: toInputSchema(RemoveItemSchema),
  },
  {
    name: 'update_quantity',
    description: 'Change the quantity of a cart item. Use 0 to remove.',
    input_schema: toInputSchema(UpdateQuantitySchema),
  },
  {
    name: 'clarify',
    description: 'Ask the user a clarifying question when the intent is ambiguous.',
    input_schema: toInputSchema(ClarifySchema),
  },
  {
    name: 'suggest_pairing',
    description: 'Proactively suggest complementary items. Call at most once per turn.',
    input_schema: toInputSchema(SuggestPairingSchema),
  },
  {
    name: 'clear_cart',
    description: 'Empty the entire cart.',
    input_schema: toInputSchema(ClearCartSchema),
  },
  {
    name: 'upsell',
    description: 'Surface a single upsell item with a short pitch.',
    input_schema: toInputSchema(UpsellSchema),
  },
  {
    name: 'update_notes',
    description: 'Set or update special preparation instructions on a cart item already in the cart (e.g. "extra spicy", "no onions", "light dressing"). Use when the user specifies how they want an item prepared.',
    input_schema: toInputSchema(UpdateNotesSchema),
  },
  {
    name: 'ask_customization',
    description: 'Open the customization sheet for a specific menu item so the user can select preparation options (cook level, cheese, toppings, sauces, etc.). Use when the user adds an item and may want to customize it, or explicitly asks to customize.',
    input_schema: toInputSchema(AskCustomizationSchema),
  },
];

export type ToolName = 'add_item' | 'remove_item' | 'update_quantity' | 'clarify' | 'suggest_pairing' | 'clear_cart' | 'upsell' | 'update_notes' | 'ask_customization';

export interface ValidatedToolCall {
  name: ToolName;
  input: Record<string, unknown>;
  status: 'applied' | 'rejected';
  rejectionReason?: string;
}

export function validateToolInput(
  name: string,
  input: unknown,
): { success: true; data: unknown } | { success: false; error: string } {
  const schemaMap: Record<string, z.ZodType> = {
    add_item:        AddItemSchema,
    remove_item:     RemoveItemSchema,
    update_quantity: UpdateQuantitySchema,
    clarify:         ClarifySchema,
    suggest_pairing: SuggestPairingSchema,
    clear_cart:      ClearCartSchema,
    upsell:          UpsellSchema,
    update_notes:      UpdateNotesSchema,
    ask_customization: AskCustomizationSchema,
  };

  const schema = schemaMap[name];
  if (!schema) return { success: false, error: `Unknown tool: ${name}` };

  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map(i => i.message).join('; ') };
}
