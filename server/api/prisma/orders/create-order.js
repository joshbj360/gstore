import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const order = await prisma.order.create({
        data: {
            userId: body.userId,
            stripeId: body.stripeId,
            name: body.name,
            address: body.address,
            zipCode: body.zipcode,
            city: body.city,
            country: body.country,
        }
    })

    body.products.forEach(async (product) => {
        await prisma.orderItem.create({
            data: {
                orderId: order.id,
                productId: product.id,
                // quantity: product.quantity
            }
        })
    })

    return order
})