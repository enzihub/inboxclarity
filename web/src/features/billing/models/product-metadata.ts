import z from 'zod';

export const priceCardVariantSchema = z.enum(['free', 'premium']);

// Add your product-related metadata here. Can be product features given in the product.
export const productMetadataSchema = z
  .object({
    price_card_variant: priceCardVariantSchema,
    newsletter_videos: z.enum(['3', '12']),
  })
  .transform((data) => ({
    priceCardVariant: data.price_card_variant,
    newsletterVideos: data.newsletter_videos,
  }));

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type PriceCardVariant = z.infer<typeof priceCardVariantSchema>;
