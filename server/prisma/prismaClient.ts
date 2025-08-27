import { PrismaClient } from "@prisma/client";
import { generateUniqueSlug } from "../utils/slugify";

// This function creates the extension logic
const slugExtension = {
  model: {
    $allModels: {
      async create(args: any) {
        const modelName = (this as any)._meta.name;
        
        if (modelName === 'Products' && args.data.title) {
          args.data.slug = await generateUniqueSlug('products', args.data.title);
        }
        if (modelName === 'Category' && args.data.name) {
          args.data.slug = await generateUniqueSlug('category', args.data.name);
        }
        if (modelName === 'SellerProfile' && args.data.store_name) {
          args.data.store_name = await generateUniqueSlug('sellerProfile', args.data.store_name);
        }
        
        // @ts-ignore
        return (this as any).create(args);
      },
      async update(args: any) {
        const modelName = (this as any)._meta.name;
        const id = args.where?.id;

        if (modelName === 'Products' && args.data.title) {
          args.data.slug = await generateUniqueSlug('products', args.data.title, id);
        }
        if (modelName === 'Category' && args.data.name) {
          args.data.slug = await generateUniqueSlug('category', args.data.name, id);
        }
        if (modelName === 'SellerProfile' && args.data.store_name) {
          args.data.store_name = await generateUniqueSlug('sellerProfile', args.data.store_name, id);
        }

        // @ts-ignore
        return (this as any).update(args);
      },
    },
  },
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
const extendedPrisma = prisma.$extends(slugExtension);

// Export the single, configured instance
export default extendedPrisma;

