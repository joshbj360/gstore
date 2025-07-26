import { PrismaClient, $Enums } from '@prisma/client';
import { MediaInterface } from '~/models/interface/products/media.interface';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { serverSupabaseUser } from '#supabase/server';
import { parse } from 'csv-parse/sync';
import { createError } from 'h3';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const body = await readMultipartFormData(event);
  console.log('Received multipart data:', body);
  const file = body?.find((part) => part.name === 'file');
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'CSV file is required' });
  }

  try {
    const csvData = file.data.toString('utf-8');
    console.log('Raw CSV data length:', csvData.length);
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
    console.log('Parsed records:', records);

    if (!records.length) {
      throw createError({ statusCode: 400, message: 'No valid records found in CSV' });
    }

    // Batch processing with a batch size of 5
    const batchSize = 5;
    const createdProducts = [];
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchProducts = await prisma.$transaction(
        async (tx) => {
          const products = [];
          for (const [index, record] of batch.entries()) {
            console.log(`Processing record ${i + index + 1}:`, record);
            if (!record.title?.trim() || !record.price || !record.slug?.trim()) {
              throw createError({
                statusCode: 400,
                message: `Missing required fields for product: ${record.title || 'Untitled'}`,
              });
            }

            const price = parseFloat(record.price);
            const stock = record.stock ? parseInt(record.stock, 10) : null;
            if (isNaN(price) || (stock !== null && isNaN(stock))) {
              throw createError({
                statusCode: 400,
                message: `Invalid price or stock for product: ${record.title}`,
              });
            }

            const tags = record.tags ? record.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
            const mediaUrls = record.media_urls ? record.media_urls.split(',').map((url: string) => url.trim()).filter(Boolean) : [];
            const mediaTypes = record.media_types ? record.media_types.split(',').map((type: string) => type.trim() as $Enums.MediaType).filter(Boolean) : [];
            const media = mediaUrls.map((url: string, index: number) => ({
              url,
              type: mediaTypes[index] || 'IMAGE',
            })) as MediaInterface[];

            try {
              const product = await tx.products.create({
                data: {
                  title: record.title.trim(),
                  description: record.description?.trim() || null,
                  price,
                  stock,
                  slug: record.slug.trim(),
                  sellerId: user.id,
                  created_at: new Date(),
                  updated_at: new Date(),
                  category: record.category
                    ? {
                        create: [
                          {
                            category: {
                              connectOrCreate: {
                                where: { name: record.category.trim() },
                                create: {
                                  name: record.category.trim(),
                                  thumbnailCatUrl: record.thumbnailUrl || null,
                                },
                              },
                            },
                          },
                        ],
                      }
                    : undefined,
                  tags: tags.length
                    ? {
                        create: tags.map((tag: string) => ({
                          tag: {
                            connectOrCreate: {
                              where: { name: tag },
                              create: { name: tag },
                            },
                          },
                        })),
                      }
                    : undefined,
                  media: media.length
                    ? {
                        create: media,
                      }
                    : undefined,
                },
                include: {
                  category: { include: { category: true } },
                  tags: { include: { tag: true } },
                  media: true,
                },
              });
              products.push(product);
            } catch (innerError) {
              console.error(`Error creating product ${record.title}:`, innerError);
              throw createError({
                statusCode: 400,
                message: `Failed to create product ${record.title}: ${innerError}`,
              });
            }
          }
          return products;
        },
        { timeout: 30000 } // 30-second timeout per batch
      );
      createdProducts.push(...batchProducts);
    }

    return { message: 'Products uploaded successfully', count: createdProducts.length, products: createdProducts };
  } catch (error) {
    console.error('Transaction error:', error);
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Could not process bulk upload',
        message: `Error: ${error.message}`,
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not process bulk upload',
      message: 'An unexpected error occurred',
    });
  } finally {
    await prisma.$disconnect();
  }
});