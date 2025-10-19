import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const params = event
    let items = await prisma.products.findMany({
        take: 5, //max rows
        where: {
            title: {
                contains: event.context.params.id,
                mode: 'insensitive'
            }
        },
         select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            media: {
                take: 1,
                select: { url: true }
            }
        },
        take: 5,
    })

    return items
})