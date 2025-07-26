import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const limit = Number(query.limit) || 20
    const page = Number(query.page) || 1
    const offset = (page - 1) * limit //pagination logic
    try {
        const products = await prisma.products.findMany({
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true
                    },
                },
                media: true,
                measurement: true
            },
            skip: offset,
            take: limit,
            orderBy: {created_at: 'desc'}
        })
    return products

    } catch (error) {
        return error
    }
})