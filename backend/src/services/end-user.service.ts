import { EndUserKind } from '@prisma/client'
import { prisma } from '../prisma/client.js'

const ANON_TTL_MS = 30 * 24 * 60 * 60 * 1000

interface ResolveEndUserArgs {
  chatbotId: string
  identifier: string
  kind: EndUserKind
}

// Upserts an EndUser by (chatbotId, kind, identifier). For ANONYMOUS, bumps
// expiresAt forward on every call — sliding renewal. EMAIL/PHONE rows have
// no expiry. Called once per session creation in the chat controller.
export async function resolveEndUser({
  chatbotId,
  identifier,
  kind,
}: ResolveEndUserArgs): Promise<string> {
  const expiresAt = kind === EndUserKind.ANONYMOUS ? new Date(Date.now() + ANON_TTL_MS) : null

  const endUser = await prisma.endUser.upsert({
    where: {
      chatbotId_kind_identifier: { chatbotId, kind, identifier },
    },
    create: { chatbotId, kind, identifier, expiresAt },
    update: kind === EndUserKind.ANONYMOUS ? { expiresAt } : {},
    select: { id: true },
  })

  return endUser.id
}
