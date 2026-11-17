import type { FastifyReply } from 'fastify'
import type { Failure } from '../domain/result.ts'

// Erros em application/problem+json (research.md item 15; contracts/auth.md).

const TITLES: Record<number, string> = {
  400: 'Requisição inválida',
  401: 'Não autenticado',
  403: 'Sem permissão',
  404: 'Não encontrado',
  409: 'Conflito com o estado atual',
  500: 'Erro interno',
}

export function sendProblem(
  reply: FastifyReply,
  status: number,
  code: string,
  detail: string,
  extra: Record<string, unknown> = {},
): FastifyReply {
  return reply
    .code(status)
    .type('application/problem+json')
    .send({ type: 'about:blank', title: TITLES[status] ?? 'Erro', status, detail, code, ...extra })
}

/** Traduz a recusa de uma regra no status escolhido pela rota. */
export function sendFailure(
  reply: FastifyReply,
  failure: Failure,
  statusByCode: Record<string, number>,
  fallbackStatus = 409,
): FastifyReply {
  return sendProblem(reply, statusByCode[failure.code] ?? fallbackStatus, failure.code, failure.message)
}
