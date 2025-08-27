import slugify from "slugify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate a unique slug for Products, Category, or SellerProfile
 * @param model - Prisma model name ("products" | "category" | "sellerProfile")
 * @param baseString - String to slugify
 * @param id - (Optional) id of existing row (used in updates)
 */
export async function generateUniqueSlug(
  model: "products" | "category" | "sellerProfile",
  baseString: string,
  id?: string | number
): Promise<string> {
  const base = slugify(baseString, { lower: true, strict: true });
  let slug = base || "item";
  let counter = 1;

  while (true) {
    const exists = await (prisma as any)[model].findUnique({
      where: { slug },
    });

    // slug available, or updating the same row
    if (!exists || (id && exists.id === id)) {
      return slug;
    }

    slug = `${base}-${counter++}`;
  }
}
