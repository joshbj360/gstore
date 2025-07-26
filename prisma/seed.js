import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const sellerId = uuidv4();

  // 1. Create Profile
  const profile = await prisma.profile.create({
    data: {
      id: sellerId,
      email: 'stylist@fashionhub.com',
      username: 'FashionGuru',
      role: 'seller',
      avatar: null,
    },
  });

  // 2. Create Categories and Tags
  const category = await prisma.category.create({
    data: {
      name: 'Men Clothing',
      thumbnailCatUrl: null,
    },
  });

  const tag1 = await prisma.tag.create({ data: { name: 'T-Shirts' } });
  const tag2 = await prisma.tag.create({ data: { name: 'Cotton' } });

  // 3. Create Product
  const product = await prisma.products.create({
    data: {
      title: 'Casual Cotton T-Shirt',
      slug: 'casual-cotton-tshirt',
      description: 'Breathable cotton t-shirt perfect for hot weather.',
      price: 7500,
      stock: 50,
      discount: 5,
      sizes: ['M', 'L', 'XL'],
      sellerId: sellerId,
      status: 'PUBLISHED',
      category: {
        create: [{ categoryId: category.id }]
      },
      tags: {
        create: [
          { tagId: tag1.id },
          { tagId: tag2.id }
        ]
      },
      media: {
        create: [
          {
            url: 'https://example.com/images/tshirt-front.jpg',
            type: 'IMAGE',
          },
          {
            url: 'https://example.com/images/tshirt-back.jpg',
            type: 'IMAGE',
          }
        ]
      },
      measurement: {
        create: {
          weight: 0.2,
          length: 75,
          width: 50,
          height: 1
        }
      },
    }
  });

  // 4. Add Like and Share
  await prisma.like.create({
    data: {
      userId: sellerId,
      productId: product.id,
    }
  });

  await prisma.share.create({
    data: {
      userId: sellerId,
      productId: product.id,
      platform: 'Instagram',
      shareUrl: 'https://instagram.com/fashionhub/post/123'
    }
  });

  // 5. Create Order with Item
  const order = await prisma.orders.create({
    data: {
      userId: sellerId,
      stripeId: 'stripe_test_001',
      name: 'FashionGuru',
      address: '22 Style Lane',
      zipcode: '10101',
      city: 'Lagos',
      country: 'Nigeria',
      totalAmount: 7125, // 7500 - 5%
      status: 'COMPLETED',
      orderItem: {
        create: {
          productId: product.id,
          quantity: 1,
        }
      }
    }
  });

  console.log('✅ Fashion seed completed!');
}

main()
  .catch(e => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
