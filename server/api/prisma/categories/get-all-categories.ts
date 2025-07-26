import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export default defineEventHandler(async () => {

    try {
        const categories = prisma.category.findMany()
        return categories
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Could not fetch categories',
        });
    } finally {
        await prisma.$disconnect();
    }
})