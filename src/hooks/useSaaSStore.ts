import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { BRAND_PROFILES, INITIAL_COMMENTS, INITIAL_POSTS } from '../data/seedData';
import {
  INITIAL_INVOICES,
  INITIAL_TEAM_SEATS,
  SAAS_PLANS,
} from '../data/saasPlans';
import {
  AudienceComment,
  BillingCycle,
  BillingInvoice,
  BrandProfile,
  PlanTier,
  SocialPost,
  TeamSeat,
  TenantAccount,
} from '../types';

const DEMO_TENANT: TenantAccount = {
  ownerId: 'demo',
  ownerEmail: 'demo@cadence.app',
  companyName: 'Northstar Digital Agency',
  planTier: 'agency',
  billingCycle: 'monthly',
  subscriptionStatus: 'trialing',
  aiCreditsUsed: 14,
  aiCreditsLimit: SAAS_PLANS.agency.aiCreditsLimit,
  maxWorkspaces: SAAS_PLANS.agency.maxWorkspaces,
  whiteLabelName: 'Northstar Client Studio',
};

const STORAGE_KEYS = {
  TENANT: 'cadence_saas_tenant_v2',
  BRANDS: 'cadence_brands_v2',
  POSTS: 'cadence_posts_v2',
  TEAM: 'cadence_team_v2',
  INVOICES: 'cadence_invoices_v2',
  COMMENTS: 'cadence_comments_v2',
};

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) || `id-${Date.now()}`;
}

export function useSaaSStore() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [pendingSignupPlan, setPendingSignupPlan] = useState<{
    plan: PlanTier;
    cycle: BillingCycle;
  }>({ plan: 'growth', cycle: 'annual' });

  const [tenant, setTenant] = useState<TenantAccount>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TENANT);
      return saved ? JSON.parse(saved) : DEMO_TENANT;
    } catch {
      return DEMO_TENANT;
    }
  });

  const [brands, setBrands] = useState<BrandProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANDS);
      return saved ? JSON.parse(saved) : BRAND_PROFILES;
    } catch {
      return BRAND_PROFILES;
    }
  });

  const [posts, setPosts] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [teamSeats, setTeamSeats] = useState<TeamSeat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAM);
      return saved ? JSON.parse(saved) : INITIAL_TEAM_SEATS;
    } catch {
      return INITIAL_TEAM_SEATS;
    }
  });

  const [invoices, setInvoices] = useState<BillingInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [comments, setComments] = useState<AudienceComment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });

  // Sync demo mode state to localStorage when not authenticated
  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(tenant));
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(teamSeats));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    } catch {
      // Ignore storage quota errors
    }
  }, [user, tenant, brands, posts, teamSeats, invoices, comments]);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Provision or subscribe to Firestore tenant data once authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const uid = user.uid;
    const tenantRef = doc(db, 'tenants', uid);

    let unsubTenant = () => {};
    let unsubWorkspaces = () => {};
    let unsubPosts = () => {};
    let unsubTeam = () => {};
    let unsubInvoices = () => {};

    const bootstrapAndSubscribe = async () => {
      try {
        const snap = await getDoc(tenantRef);
        if (!snap.exists()) {
          const chosenPlan = SAAS_PLANS[pendingSignupPlan.plan];
          const companyName =
            user.displayName ? `${user.displayName}'s Agency` : 'My Marketing Workspace';

          await setDoc(tenantRef, {
            ownerId: uid,
            ownerEmail: user.email || 'user@example.com',
            companyName: companyName.slice(0, 80),
            planTier: chosenPlan.id,
            billingCycle: pendingSignupPlan.cycle,
            subscriptionStatus: 'trialing',
            aiCreditsUsed: 0,
            aiCreditsLimit: chosenPlan.aiCreditsLimit,
            maxWorkspaces: chosenPlan.maxWorkspaces,
            whiteLabelName: companyName.slice(0, 60),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const batch = writeBatch(db);
          const starterBrand = BRAND_PROFILES[0];
          const wsRef = doc(db, 'tenants', uid, 'workspaces', starterBrand.id);
          batch.set(wsRef, {
            ownerId: uid,
            name: starterBrand.name,
            handle: starterBrand.handle,
            category: starterBrand.category,
            industry: starterBrand.industry,
            audience: starterBrand.audience,
            voice: starterBrand.voice,
            coverImage: starterBrand.coverImage,
            linkedinAccount: starterBrand.connectedAccounts.linkedin,
            facebookAccount: starterBrand.connectedAccounts.facebook,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          for (const seedPost of INITIAL_POSTS.filter(
            (p) => p.brandId === starterBrand.id
          )) {
            const pRef = doc(db, 'tenants', uid, 'posts', seedPost.id);
            batch.set(pRef, {
              ownerId: uid,
              workspaceId: starterBrand.id,
              platform: seedPost.platform,
              title: seedPost.title,
              pillar: seedPost.pillar,
              caption: seedPost.caption,
              hashtags: seedPost.hashtags,
              scheduledDate: seedPost.scheduledDate,
              scheduledTime: seedPost.scheduledTime,
              status: seedPost.status,
              imageUrl: seedPost.imageUrl || '',
              source: seedPost.source || 'manual',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          const ownerSeatRef = doc(db, 'tenants', uid, 'team', 'seat-owner');
          batch.set(ownerSeatRef, {
            ownerId: uid,
            name: (user.displayName || 'Account Owner').slice(0, 80),
            email: user.email || 'owner@example.com',
            role: 'Owner',
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const invRef = doc(db, 'tenants', uid, 'invoices', 'inv-trial-01');
          batch.set(invRef, {
            ownerId: uid,
            invoiceNumber: 'CAD-TRIAL-001',
            planName: `${chosenPlan.name} (14-Day Trial)`,
            amountUsd: 0,
            billingDate: new Date().toISOString().slice(0, 10),
            status: 'Paid',
            createdAt: serverTimestamp(),
          });

          await batch.commit();
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tenants/${uid}`);
      }

      unsubTenant = onSnapshot(
        tenantRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const d = docSnap.data();
            setTenant({
              ownerId: d.ownerId,
              ownerEmail: d.ownerEmail,
              companyName: d.companyName,
              planTier: d.planTier,
              billingCycle: d.billingCycle,
              subscriptionStatus: d.subscriptionStatus,
              aiCreditsUsed: d.aiCreditsUsed,
              aiCreditsLimit: d.aiCreditsLimit,
              maxWorkspaces: d.maxWorkspaces,
              whiteLabelName: d.whiteLabelName,
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `tenants/${uid}`)
      );

      unsubWorkspaces = onSnapshot(
        collection(db, 'tenants', uid, 'workspaces'),
        (snap) => {
          const list: BrandProfile[] = snap.docs.map((d) => {
            const data = d.data();
            const fallback =
              BRAND_PROFILES.find((b) => b.category === data.category) ||
              BRAND_PROFILES[0];
            return {
              id: d.id,
              name: data.name,
              handle: data.handle,
              category: data.category,
              industry: data.industry,
              audience: data.audience,
              voice: data.voice,
              coverImage: data.coverImage,
              connectedAccounts: {
                linkedin: data.linkedinAccount,
                facebook: data.facebookAccount,
              },
              metrics: fallback.metrics,
              weeklySeries: fallback.weeklySeries,
            };
          });
          if (list.length > 0) setBrands(list);
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `tenants/${uid}/workspaces`
          )
      );

      unsubPosts = onSnapshot(
        collection(db, 'tenants', uid, 'posts'),
        (snap) => {
          const list: SocialPost[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              brandId: data.workspaceId,
              platform: data.platform,
              title: data.title,
              pillar: data.pillar,
              caption: data.caption,
              hashtags: data.hashtags || [],
              scheduledDate: data.scheduledDate,
              scheduledTime: data.scheduledTime,
              status: data.status,
              revisionNote: data.revisionNote,
              imageUrl: data.imageUrl || undefined,
              source: data.source,
              createdAt:
                typeof data.createdAt?.toDate === 'function'
                  ? data.createdAt.toDate().toISOString()
                  : new Date().toISOString(),
            };
          });
          setPosts(list);
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, `tenants/${uid}/posts`)
      );

      unsubTeam = onSnapshot(
        collection(db, 'tenants', uid, 'team'),
        (snap) => {
          const list: TeamSeat[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              name: data.name,
              email: data.email,
              role: data.role,
              status: data.status,
            };
          });
          setTeamSeats(list);
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, `tenants/${uid}/team`)
      );

      unsubInvoices = onSnapshot(
        collection(db, 'tenants', uid, 'invoices'),
        (snap) => {
          const list: BillingInvoice[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: data.ownerId,
              invoiceNumber: data.invoiceNumber,
              planName: data.planName,
              amountUsd: data.amountUsd,
              billingDate: data.billingDate,
              status: data.status,
            };
          });
          setInvoices(list);
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `tenants/${uid}/invoices`
          )
      );
    };

    bootstrapAndSubscribe();

    return () => {
      unsubTenant();
      unsubWorkspaces();
      unsubPosts();
      unsubTeam();
      unsubInvoices();
    };
  }, [authReady, user, pendingSignupPlan]);

  const signInWithGoogle = async (plan: PlanTier, cycle: BillingCycle) => {
    setPendingSignupPlan({ plan, cycle });
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In failed.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setTenant(DEMO_TENANT);
    setBrands(BRAND_PROFILES);
    setPosts(INITIAL_POSTS);
    setTeamSeats(INITIAL_TEAM_SEATS);
    setInvoices(INITIAL_INVOICES);
  };

  const consumeAICredit = async (count = 1): Promise<boolean> => {
    if (tenant.aiCreditsUsed + count > tenant.aiCreditsLimit) {
      return false;
    }
    const nextUsed = tenant.aiCreditsUsed + count;
    if (user) {
      try {
        await updateDoc(doc(db, 'tenants', user.uid), {
          aiCreditsUsed: nextUsed,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `tenants/${user.uid}`
        );
      }
    } else {
      setTenant((prev) => ({ ...prev, aiCreditsUsed: nextUsed }));
    }
    return true;
  };

  const addWorkspace = async (newBrand: BrandProfile) => {
    const safeId = sanitizeId(newBrand.id);
    const brandWithId = { ...newBrand, id: safeId };
    if (user) {
      try {
        await setDoc(doc(db, 'tenants', user.uid, 'workspaces', safeId), {
          ownerId: user.uid,
          name: brandWithId.name.slice(0, 80),
          handle: brandWithId.handle.slice(0, 40),
          category: brandWithId.category,
          industry: brandWithId.industry.slice(0, 160),
          audience: brandWithId.audience.slice(0, 200),
          voice: brandWithId.voice.slice(0, 200),
          coverImage: brandWithId.coverImage.slice(0, 250),
          linkedinAccount: brandWithId.connectedAccounts.linkedin.slice(0, 80),
          facebookAccount: brandWithId.connectedAccounts.facebook.slice(0, 80),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `tenants/${user.uid}/workspaces/${safeId}`
        );
      }
    } else {
      setBrands((prev) => [...prev, brandWithId]);
    }
    return brandWithId;
  };

  const addPosts = async (newPosts: SocialPost[]) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        for (const p of newPosts) {
          const safeId = sanitizeId(p.id);
          batch.set(doc(db, 'tenants', user.uid, 'posts', safeId), {
            ownerId: user.uid,
            workspaceId: sanitizeId(p.brandId),
            platform: p.platform,
            title: p.title.slice(0, 140),
            pillar: p.pillar.slice(0, 80),
            caption: p.caption.slice(0, 4000),
            hashtags: p.hashtags.slice(0, 15),
            scheduledDate: p.scheduledDate,
            scheduledTime: p.scheduledTime,
            status: p.status,
            imageUrl: p.imageUrl || '',
            source: p.source || 'manual',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `tenants/${user.uid}/posts`
        );
      }
    } else {
      setPosts((prev) => [...newPosts, ...prev]);
    }
  };

  const updatePost = async (postId: string, updates: Partial<SocialPost>) => {
    if (user) {
      try {
        const payload: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.revisionNote !== undefined)
          payload.revisionNote = updates.revisionNote.slice(0, 500);
        if (updates.caption !== undefined)
          payload.caption = updates.caption.slice(0, 4000);
        if (updates.hashtags !== undefined)
          payload.hashtags = updates.hashtags.slice(0, 15);
        if (updates.title !== undefined)
          payload.title = updates.title.slice(0, 140);
        if (updates.scheduledDate !== undefined)
          payload.scheduledDate = updates.scheduledDate;
        if (updates.scheduledTime !== undefined)
          payload.scheduledTime = updates.scheduledTime;

        await updateDoc(doc(db, 'tenants', user.uid, 'posts', postId), payload);
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `tenants/${user.uid}/posts/${postId}`
        );
      }
    } else {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
      );
    }
  };

  const approveAllPendingForBrand = async (brandId: string) => {
    const targets = posts.filter(
      (p) => p.brandId === brandId && p.status === 'pending_approval'
    );
    if (targets.length === 0) return;
    if (user) {
      try {
        const batch = writeBatch(db);
        for (const p of targets) {
          batch.update(doc(db, 'tenants', user.uid, 'posts', p.id), {
            status: 'approved',
            revisionNote: '',
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `tenants/${user.uid}/posts`
        );
      }
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          p.brandId === brandId && p.status === 'pending_approval'
            ? { ...p, status: 'approved', revisionNote: undefined }
            : p
        )
      );
    }
  };

  const deletePost = async (postId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'tenants', user.uid, 'posts', postId));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `tenants/${user.uid}/posts/${postId}`
        );
      }
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const changePlan = async (planTier: PlanTier, billingCycle: BillingCycle) => {
    const plan = SAAS_PLANS[planTier];
    const amountUsd =
      billingCycle === 'annual' ? plan.annualMonthlyPrice * 12 : plan.monthlyPrice;
    const invId = `inv-${Date.now()}`;
    const invNumber = `CAD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    if (user) {
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'tenants', user.uid), {
          planTier,
          billingCycle,
          subscriptionStatus: 'active',
          aiCreditsLimit: plan.aiCreditsLimit,
          maxWorkspaces: plan.maxWorkspaces,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'tenants', user.uid, 'invoices', invId), {
          ownerId: user.uid,
          invoiceNumber: invNumber,
          planName: `${plan.name} (${billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
          amountUsd,
          billingDate: new Date().toISOString().slice(0, 10),
          status: 'Paid',
          createdAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `tenants/${user.uid}`
        );
      }
    } else {
      setTenant((prev) => ({
        ...prev,
        planTier,
        billingCycle,
        subscriptionStatus: 'active',
        aiCreditsLimit: plan.aiCreditsLimit,
        maxWorkspaces: plan.maxWorkspaces,
      }));
      setInvoices((prev) => [
        {
          id: invId,
          ownerId: 'demo',
          invoiceNumber: invNumber,
          planName: `${plan.name} (${billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
          amountUsd,
          billingDate: new Date().toISOString().slice(0, 10),
          status: 'Paid',
        },
        ...prev,
      ]);
    }
  };

  const updateWhiteLabel = async (
    companyName: string,
    whiteLabelName: string
  ) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'tenants', user.uid), {
          companyName: companyName.slice(0, 80),
          whiteLabelName: whiteLabelName.slice(0, 60),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `tenants/${user.uid}`
        );
      }
    } else {
      setTenant((prev) => ({ ...prev, companyName, whiteLabelName }));
    }
  };

  const addTeamSeat = async (
    name: string,
    email: string,
    role: TeamSeat['role']
  ) => {
    const seatId = `seat-${Date.now()}`;
    if (user) {
      try {
        await setDoc(doc(db, 'tenants', user.uid, 'team', seatId), {
          ownerId: user.uid,
          name: name.slice(0, 80),
          email: email.slice(0, 160),
          role,
          status: 'Invited',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `tenants/${user.uid}/team/${seatId}`
        );
      }
    } else {
      setTeamSeats((prev) => [
        ...prev,
        {
          id: seatId,
          ownerId: 'demo',
          name,
          email,
          role,
          status: 'Invited',
        },
      ]);
    }
  };

  const removeTeamSeat = async (seatId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'tenants', user.uid, 'team', seatId));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `tenants/${user.uid}/team/${seatId}`
        );
      }
    } else {
      setTeamSeats((prev) => prev.filter((s) => s.id !== seatId));
    }
  };

  return {
    user,
    authReady,
    isAuthLoading,
    authError,
    tenant,
    brands,
    posts,
    teamSeats,
    invoices,
    comments,
    setComments,
    signInWithGoogle,
    signOutUser,
    consumeAICredit,
    addWorkspace,
    addPosts,
    updatePost,
    approveAllPendingForBrand,
    deletePost,
    changePlan,
    updateWhiteLabel,
    addTeamSeat,
    removeTeamSeat,
  };
}
