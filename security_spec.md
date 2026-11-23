# Cadence SaaS Security Specification

## 1. Data Invariants
1. A TenantAccount document at `/tenants/{tenantId}` can only be read, created, or updated by the verified authenticated user whose `request.auth.uid == tenantId` and `ownerId == request.auth.uid`.
2. Every subcollection document (`workspaces`, `posts`, `team`, `invoices`) MUST verify parent tenant ownership via `get(/databases/$(database)/documents/tenants/$(tenantId)).data.ownerId == request.auth.uid` on writes, and enforce `ownerId == request.auth.uid` on reads/lists without `get()` in `allow list`.
3. `createdAt` is immutable and must equal `request.time` on creation; `updatedAt` must equal `request.time` on both creation and updates.
4. Terminal states (`status == 'published'` on posts, and `invoices` records) cannot be overwritten once finalized.
5. `ownerEmail`, `email`, and billing `invoices` are strictly isolated to the verified tenant owner (`isTenantOwner(tenantId)`).

## 2. Dirty Dozen Adversarial Payloads
1. Cross-tenant read: User B requests `/tenants/userA`. Expected: `PERMISSION_DENIED`.
2. Unverified email write: User A with `email_verified: false` creates `/tenants/userA`. Expected: `PERMISSION_DENIED`.
3. Identity spoofing on create: User B creates `/tenants/userB` with `ownerId: "userA"`. Expected: `PERMISSION_DENIED`.
4. Shadow field injection: User A sends `{ ..., isAdmin: true }` to `/tenants/userA`. Expected: `PERMISSION_DENIED`.
5. Plan limit tampering on post create: User A injects `hashtags` with 50 items (> 15). Expected: `PERMISSION_DENIED`.
6. Path ID poisoning: User A writes `/tenants/userA/posts/invalid..id!@#`. Expected: `PERMISSION_DENIED`.
7. Timestamp spoofing: User A sets `createdAt` to a client past timestamp. Expected: `PERMISSION_DENIED`.
8. Immutable ownerId mutation: User A updates `/tenants/userA` changing `ownerId`. Expected: `PERMISSION_DENIED`.
9. Terminal state bypass: User A updates a `published` post back to `pending_approval`. Expected: `PERMISSION_DENIED`.
10. Invoice tampering: User A updates an existing invoice in `/tenants/userA/invoices/{id}`. Expected: `PERMISSION_DENIED`.
11. Unbounded caption payload: User A sends a 10,000-char caption (> 4,000 limit). Expected: `PERMISSION_DENIED`.
12. Blanket list scraping: User B queries `collection(db, 'tenants/userA/posts')`. Expected: `PERMISSION_DENIED`.
