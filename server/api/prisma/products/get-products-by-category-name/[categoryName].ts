import  { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient

export default defineEventHandler(async (event) => {
    const categoryName = event.context.params?.categoryName

    if (!categoryName) {
        throw createError({
            statusCode: 400,
            statusMessage: 'category name is required'
        })
    }
    try {
        //get the selected category
        const products = await prisma.products.findMany({
            where: {
                category: {
                    some: {
                        category: {
                            name: {
                                contains: decodeURIComponent(categoryName),
                                mode: 'insensitive'
                            }
                        }
                    }
                }
            },
            include: {
                category:{
                    include: {
                        category: true
                    }
                },
                media: true,
                tags: {
                    include: {
                        tag: true
                    }
                },
                measurement: true
            }
        })
        return products
    } catch (error) {
        console.error('Error fetching products by category ID:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        })
    }
})