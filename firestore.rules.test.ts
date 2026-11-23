/**
 * Firestore Security Rules Test Specification (Dirty Dozen Adversarial Matrix)
 * Verifies all 12 adversarial payloads against /tenants/{tenantId} and subcollections.
 */

export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Cross-tenant read', path: '/tenants/userA', actor: 'userB', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email write', path: '/tenants/userA', actor: 'unverifiedA', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity spoofing on create', path: '/tenants/userB', payload: { ownerId: 'userA' }, expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection', path: '/tenants/userA', payload: { isAdmin: true }, expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Hashtags array overflow (>15)', path: '/tenants/userA/posts/p1', payload: { hashtagsCount: 50 }, expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Path ID poisoning', path: '/tenants/userA/posts/invalid..id!', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Client timestamp spoofing', path: '/tenants/userA', payload: { createdAt: '2020-01-01T00:00:00Z' }, expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Immutable ownerId mutation', path: '/tenants/userA', payload: { ownerId: 'userB' }, expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Terminal published post downgrade', path: '/tenants/userA/posts/p1', payload: { status: 'pending_approval' }, expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Immutable invoice update', path: '/tenants/userA/invoices/inv1', payload: { amountUsd: 0 }, expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Unbounded caption payload (>4000)', path: '/tenants/userA/posts/p1', payload: { captionLength: 10000 }, expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Blanket list query scraping', path: '/tenants/userA/posts', actor: 'userB', expected: 'PERMISSION_DENIED' },
] as const;
