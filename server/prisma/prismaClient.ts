import { PrismaClient } from "@prisma/client";
import { generateUniqueSlug } from "../utils/slugify";

// This function creates the refined extension logic
const getSlugExtension = () => {
  return {
    model: {
      // THE FIX: We now target each model individually instead of using `$allModels`.
      // This ensures the logic only runs where it's needed.
      products: {
        async create(args: any) {
          if (args.data.title) {
            args.data.slug = await generateUniqueSlug('products', args.data.title);
          }
          return (prisma.products as any).create(args);
        },
        async update(args: any) {
          if (args.data.title) {
            const id = args.where?.id;
            args.data.slug = await generateUniqueSlug('products', args.data.title, id);
          }
          return (prisma.products as any).update(args);
        },
      },
      category: {
        async create(args: any) {
          if (args.data.name) {
            args.data.slug = await generateUniqueSlug('category', args.data.name);
          }
          return (prisma.category as any).create(args);
        },
        async update(args: any) {
          if (args.data.name) {
            const id = args.where?.id;
            args.data.slug = await generateUniqueSlug('category', args.data.name, id);
          }
          return (prisma.category as any).update(args);
        },
      },
      sellerProfile: {
        async create(args: any) {
          if (args.data.store_name) {
            // Note: Your schema uses store_slug, so we'll generate that.
            args.data.store_slug = await generateUniqueSlug('sellerProfile', args.data.store_name);
          }
          return (prisma.sellerProfile as any).create(args);
        },
        async update(args: any) {
          if (args.data.store_name) {
            const id = args.where?.id;
            args.data.store_slug = await generateUniqueSlug('sellerProfile', args.data.store_name, id);
          }
          return (prisma.sellerProfile as any).update(args);
        },
      },
    },
  };
};

// Declare the client instance once
let prisma: PrismaClient;

// Use a check to prevent multiple instances in development
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient();
  }
  // @ts-ignore
  prisma = global.prisma;
}

// Apply the extension to the instance
const extendedPrisma = prisma.$extends(getSlugExtension());

// Export the single, configured instance
export default extendedPrisma;