import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../../app.ts'
import { parseScaled } from '../../../domain/units.ts'
import {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  addProductColor,
  removeProductColor,
  listProductColors,
  addProductSize,
  removeProductSize,
  listProductSizes,
} from '../../../infrastructure/repositories/catalog-repo.ts'
import { reais } from '../../format.ts'
import { sendProblem } from '../../problem.ts'

// contracts/cadastros.md, /api/products. Vendas e Admin escrevem.
// Unidades: preço de venda em reais (2 casas).

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
} as const

export function registerProductRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/api/products', { preHandler: app.requireRoles('Sales', 'Production', 'Admin') }, async () =>
    listProducts(deps.db).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      defaultSellPrice: reais(p.default_sell_price_cents),
      defaultPrintProfileId: p.default_print_profile_id,
      defaultMaterialId: p.default_material_id,
      isForSale: p.is_for_sale === 1,
      offeredColors: p.offered_colors,
      offeredSizes: p.offered_sizes,
    })),
  )

  app.get<{ Params: { id: number } }>(
    '/api/products/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Sales', 'Production', 'Admin') },
    async (request, reply) => {
      const product = getProduct(deps.db, request.params.id)
      if (!product) return sendProblem(reply, 404, 'PRODUCT_NOT_FOUND', 'Modelo não encontrado.')
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        defaultSellPrice: reais(product.default_sell_price_cents),
        defaultPrintProfileId: product.default_print_profile_id,
        defaultMaterialId: product.default_material_id,
        isForSale: product.is_for_sale === 1,
        offeredColors: product.offered_colors,
        offeredSizes: product.offered_sizes,
      }
    },
  )

  app.post<{ Body: { name: string; sku: string; defaultSellPrice: number; defaultPrintProfileId: number; defaultMaterialId?: number | null; isForSale?: boolean; offeredColorIds?: number[]; offeredSizes?: string[] } }>(
    '/api/products',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'sku', 'defaultSellPrice', 'defaultPrintProfileId'],
          properties: {
            name: { type: 'string', minLength: 1 },
            sku: { type: 'string', minLength: 1 },
            defaultSellPrice: { type: 'number' },
            defaultPrintProfileId: { type: 'integer', minimum: 1 },
            defaultMaterialId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
            isForSale: { type: 'boolean' },
            offeredColorIds: { type: 'array', items: { type: 'integer', minimum: 1 } },
            offeredSizes: { type: 'array', items: { type: 'string', minLength: 1 } },
          },
        },
      },
      preHandler: app.requireRoles('Sales', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do modelo é obrigatório.')
      }
      const sku = request.body.sku.trim()
      if (sku.length === 0) {
        return sendProblem(reply, 400, 'INVALID_SKU', 'SKU do modelo é obrigatório.')
      }
      const sellPriceResult = parseScaled(request.body.defaultSellPrice, 2)
      if (!sellPriceResult.ok || sellPriceResult.value < 0) {
        return sendProblem(reply, 400, 'INVALID_SELL_PRICE', 'Preço de venda ≥ 0.')
      }
      const isForSale = request.body.isForSale !== false
      const id = createProduct(
        deps.db,
        name,
        sku,
        sellPriceResult.value,
        request.body.defaultPrintProfileId,
        request.body.defaultMaterialId ?? null,
        isForSale,
      )
      for (const colorId of request.body.offeredColorIds ?? []) {
        await addProductColor(deps.db, id, colorId)
      }
      for (const size of request.body.offeredSizes ?? []) {
        await addProductSize(deps.db, id, size.trim())
      }
      return reply.code(201).send({ id })
    },
  )

  app.put<{ Params: { id: number }; Body: { name: string; sku: string; defaultSellPrice: number; defaultPrintProfileId: number; defaultMaterialId?: number | null; isForSale?: boolean; offeredColorIds?: number[]; offeredSizes?: string[] } }>(
    '/api/products/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          required: ['name', 'sku', 'defaultSellPrice', 'defaultPrintProfileId'],
          properties: {
            name: { type: 'string', minLength: 1 },
            sku: { type: 'string', minLength: 1 },
            defaultSellPrice: { type: 'number' },
            defaultPrintProfileId: { type: 'integer', minimum: 1 },
            defaultMaterialId: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
            isForSale: { type: 'boolean' },
            offeredColorIds: { type: 'array', items: { type: 'integer', minimum: 1 } },
            offeredSizes: { type: 'array', items: { type: 'string', minLength: 1 } },
          },
        },
      },
      preHandler: app.requireRoles('Sales', 'Admin'),
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      if (name.length === 0) {
        return sendProblem(reply, 400, 'INVALID_NAME', 'Nome do modelo é obrigatório.')
      }
      const sku = request.body.sku.trim()
      if (sku.length === 0) {
        return sendProblem(reply, 400, 'INVALID_SKU', 'SKU do modelo é obrigatório.')
      }
      const sellPriceResult = parseScaled(request.body.defaultSellPrice, 2)
      if (!sellPriceResult.ok || sellPriceResult.value < 0) {
        return sendProblem(reply, 400, 'INVALID_SELL_PRICE', 'Preço de venda ≥ 0.')
      }
      const existing = getProduct(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRODUCT_NOT_FOUND', 'Modelo não encontrado.')
      const isForSale = request.body.isForSale !== false
      updateProduct(
        deps.db,
        request.params.id,
        name,
        sku,
        sellPriceResult.value,
        request.body.defaultPrintProfileId,
        request.body.defaultMaterialId ?? null,
        isForSale,
      )
      // Rebuild offered colors
      const currentColors = (await listProductColors(deps.db, request.params.id)) ?? []
      const incoming = request.body.offeredColorIds ?? []
      for (const colorId of incoming) {
        if (!currentColors.includes(colorId)) {
          await addProductColor(deps.db, request.params.id, colorId)
        }
      }
      // Rebuild offered sizes
      const currentSizes = (await listProductSizes(deps.db, request.params.id)) ?? []
      const incomingSizes = request.body.offeredSizes ?? []
      for (const size of incomingSizes) {
        if (!currentSizes.includes(size.trim())) {
          await addProductSize(deps.db, request.params.id, size.trim())
        }
      }
      return { ok: true }
    },
  )

  app.delete<{ Params: { id: number } }>(
    '/api/products/:id',
    { schema: { params: idParams }, preHandler: app.requireRoles('Sales', 'Admin') },
    async (request, reply) => {
      const existing = getProduct(deps.db, request.params.id)
      if (!existing) return sendProblem(reply, 404, 'PRODUCT_NOT_FOUND', 'Modelo não encontrado.')
      deleteProduct(deps.db, request.params.id)
      return reply.code(204).send()
    },
  )
}
