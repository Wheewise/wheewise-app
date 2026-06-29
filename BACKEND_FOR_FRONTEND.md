# Backend Documentation for Frontend Developers

> **Quick reference for Wheewise backend schema, APIs, and common patterns.**

---

## Table of Contents

1. [Database Schema (Quick Reference)](#database-schema-quick-reference)
2. [Authentication & Authorization](#authentication--authorization)
3. [Server Actions & API Routes](#server-actions--api-routes)
4. [Common Data Fetching Patterns](#common-data-fetching-patterns)
5. [Working with Prisma](#working-with-prisma)
6. [Error Handling](#error-handling)
7. [Real-World Examples](#real-world-examples)

---

## Database Schema (Quick Reference)

### Core Entities You'll Work With

#### **User**
Represents any person: buyers, dealers, inspectors, admins.

```typescript
User {
  id: string
  email?: string           // Nullable: phone-only users exist
  phone?: string           // Nullable: email-only users exist
  passwordHash?: string    // Nullable: phone-OTP users have no password
  name?: string
  role: "BUYER" | "DEALER" | "ADMIN" | "INSPECTOR"
  emailVerified?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  dealer?: Dealer         // 1-to-1: only DEALER users have this
  enquiries: Enquiry[]
  sessions: Session[]
  savedListings: SavedListing[]
  conversations: Conversation[]
  messages: Message[]
  posts: Post[]
  loanApplications: LoanApplication[]
}
```

**Frontend usage:** Use `user.role` to gate UI and `user.id` for ownership checks.

---

#### **Dealer**
Business profile for car/bike dealers.

```typescript
Dealer {
  id: string
  userId: string          // Links to User (1-to-1)
  businessName: string
  city: string
  phone: string
  whatsapp?: string
  gstin?: string
  gstVerified: boolean    // Only verified dealers can collect GST
  status: "ACTIVE" | "SUSPENDED"
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  store?: Store           // 1-to-1: storefront profile
  listings: Listing[]
  enquiries: Enquiry[]
  subscription?: Subscription
  conversations: Conversation[]
  payouts: Payout[]
}
```

**Frontend usage:** Check `gstVerified` before showing GST fields. Show suspension warning if `status === "SUSPENDED"`.

---

#### **Store** (Dealer Storefront)
Public-facing dealer profile at `/s/[slug]`.

```typescript
Store {
  id: string
  dealerId: string
  slug: string            // Unique: "sharma-auto-indore"
  logoUrl?: string        // Cloudflare R2 URL
  bannerUrl?: string
  bio?: string
  primaryColor: string    // CSS color: "#DC2626"
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Frontend usage:** Use `store.slug` to route to `/s/${slug}`. Apply `primaryColor` as accent across storefront.

---

#### **Listing** (Vehicle Inventory)
Car or bike for sale.

```typescript
Listing {
  id: string
  dealerId: string
  vehicleType: "CAR" | "BIKE"
  make: string            // "Maruti", "Hero"
  model: string           // "Swift", "Splendor"
  year: number
  fuelType: "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID"
  transmission?: "MANUAL" | "AUTOMATIC" | "AMT" | "CVT"
  odometerKm: number
  askingPrice: Decimal    // Use .toNumber() or .toString()
  description?: string
  city: string
  status: "ACTIVE" | "PAUSED" | "SOLD"
  
  // Engagement metrics
  viewCount: number
  enquiryCount: number
  
  // Premium features
  isBoosted: boolean
  boostExpiresAt?: DateTime
  
  // Insurance tracking
  insuranceProvider?: string
  insuranceExpiry?: DateTime
  
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  dealer: Dealer
  photos: ListingPhoto[]
  photos360: Listing360Photo[]
  enquiries: Enquiry[]
  savedBy: SavedListing[]
  conversations: Conversation[]
  inspections: Inspection[]
  loanApplications: LoanApplication[]
}
```

**Frontend usage:**
- Show "Boosted" badge if `isBoosted && boostExpiresAt > now`
- Hide if `status === "SOLD"`
- Display insurance expiry warning if approaching
- Increment `viewCount` on page load (via server action)

---

#### **ListingPhoto & Listing360Photo**
Images for listings.

```typescript
ListingPhoto {
  id: string
  listingId: string
  url: string             // Cloudflare R2 presigned URL
  sortOrder: number       // 0 = primary thumbnail
}

Listing360Photo {
  id: string
  listingId: string
  url: string
  angle: number           // 0°, 45°, 90°, etc.
  createdAt: DateTime
}
```

**Frontend usage:**
- Sort photos by `sortOrder` ascending
- Use angle data to build 360 viewer
- Presigned URLs expire; request fresh URLs server-side if needed

---

#### **Enquiry** (Lead)
Interested buyer's contact info.

```typescript
Enquiry {
  id: string
  listingId: string
  dealerId: string
  buyerId?: string        // Null if anonymous submission
  buyerName: string
  buyerPhone: string
  buyerEmail?: string
  message?: string
  source: "FORM" | "WHATSAPP" | "CALL"
  priority: number        // Custom sort key (dealer-assigned)
  isRead: boolean
  isContacted: boolean
  createdAt: DateTime
}
```

**Frontend usage:**
- Submit enquiry via `POST /api/leads` (server action)
- Show confirmation toast: "Dealer will contact you soon"
- Dealer sees unread badge if `!isRead`

---

#### **Conversation & Message**
Real-time chat between buyer and dealer.

```typescript
Conversation {
  id: string
  listingId: string
  buyerId: string
  dealerId: string
  lastMessageAt?: DateTime  // Denormalized: sort by this
  createdAt: DateTime
  
  messages: Message[]
}

Message {
  id: string
  conversationId: string
  senderId: string        // User who sent it
  body: string
  readAt?: DateTime       // Null if unread
  createdAt: DateTime
}
```

**Frontend usage:**
- Fetch conversation list sorted by `lastMessageAt DESC`
- Mark as read when viewed: `PATCH /api/chat/messages/:id`
- Use WebSocket for real-time updates (if implemented)

---

#### **SavedListing** (Wishlist)
Buyer's favorite listings.

```typescript
SavedListing {
  id: string
  userId: string
  listingId: string
  createdAt: DateTime
  
  // Unique: one buyer can only save a listing once
  @@unique([userId, listingId])
}
```

**Frontend usage:**
- Toggle save: `POST /api/listings/:id/save` (idempotent)
- Show heart icon if listing is saved
- Fetch user's saved listings: `GET /api/listings/saved`

---

#### **Inspection**
Quality checklist for a listing (10-category system).

```typescript
Inspection {
  id: string
  listingId: string
  inspectorId?: string    // Null until assigned
  dealerId: string
  status: "REQUESTED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  
  // JSON: { "exterior": 8, "interior": 7, "engine": 9, ... }
  checklist?: Json
  overallScore?: number   // 1–10
  notes?: string
  reportUrl?: string      // PDF in R2
  
  createdAt: DateTime
  completedAt?: DateTime
}
```

**Frontend usage:**
- Show inspection status badge on listing
- Render score as star rating if completed
- Link to `reportUrl` for full PDF report

---

#### **LoanApplication**
Buyer's loan inquiry for a vehicle.

```typescript
LoanApplication {
  id: string
  listingId: string
  buyerId: string
  nbfc: "BAJAJ_FINSERV" | "HDFC_BANK" | ... // 10 options
  amount: Decimal
  tenureMonths: number    // 12, 24, 36, etc.
  monthlyEmi: Decimal     // Pre-calculated
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED"
  
  applicantName: string
  applicantPhone: string
  applicantPan?: string
  notes?: string
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Frontend usage:**
- Show "Get Loan" CTA on listing
- Modal asks NBFC choice, amount, tenure
- Calculate/fetch EMI: `GET /api/loans/estimate?amount=800000&tenure=60&nbfc=BAJAJ_FINSERV`
- Submit: `POST /api/loans/apply`

---

#### **Post & Reply** (Community Forums)
Dealer/buyer forums.

```typescript
Post {
  id: string
  title: string
  body: string
  authorId: string
  community: "BUYER" | "DEALER"
  tags: string[]          // ["tips", "inspection"]
  isPinned: boolean
  isLocked: boolean       // No new replies
  createdAt: DateTime
  updatedAt: DateTime
  
  replies: Reply[]
  upvotes: PostUpvote[]
}

Reply {
  id: string
  postId: string
  authorId: string
  body: string
  createdAt: DateTime
}

PostUpvote {
  id: string
  postId: string
  userId: string
  
  @@unique([postId, userId])  // One upvote per user per post
}
```

**Frontend usage:**
- Show post count, upvote count
- Highlight if user has upvoted (check in `upvotes[]`)
- Separate BUYER and DEALER forums by route/tab
- Lock locked posts (disable reply form)

---

#### **Subscription**
Dealer's billing plan.

```typescript
Subscription {
  id: string
  dealerId: string
  plan: "FREE_TRIAL" | "MONTHLY" | "YEARLY"
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED"
  razorpaySubId?: string  // Razorpay subscription ID
  currentPeriodEnd: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Frontend usage:**
- Gating: FREE_TRIAL allows 5 listings; MONTHLY/YEARLY unlimited
- Show "Plan expires: X days" warning if approaching `currentPeriodEnd`
- Upsell on listing limit reached

---

#### **Payment**
Razorpay webhook audit trail.

```typescript
Payment {
  id: string
  razorpayOrderId?: string
  razorpayPaymentId?: string  // Unique: gates idempotency
  razorpayEventId?: string    // Unique: gates replay protection
  kind: "BOOST" | "SUBSCRIPTION" | "WEBHOOK"
  amount: number              // In paise (rupees × 100)
  status: "SUCCEEDED" | "FAILED" | "REFUNDED"
  
  notes: Json                 // { dealerId, listingId, duration, ... }
  dealerId?: string
  listingId?: string
  createdAt: DateTime
}
```

**Frontend usage:**
- Don't render directly; use for debugging
- Admin dashboard can view payment history

---

### Enum Reference

```typescript
// User role (access control)
Role = "BUYER" | "DEALER" | "ADMIN" | "INSPECTOR"

// Vehicle specs
VehicleType = "CAR" | "BIKE"
FuelType = "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID"
Transmission = "MANUAL" | "AUTOMATIC" | "AMT" | "CVT"

// Listing state
ListingStatus = "ACTIVE" | "PAUSED" | "SOLD"

// Lead source
EnquirySource = "FORM" | "WHATSAPP" | "CALL"

// Dealer state
DealerStatus = "ACTIVE" | "SUSPENDED"

// Dealer plan
PlanTier = "FREE_TRIAL" | "MONTHLY" | "YEARLY"
SubStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED"

// Inspection
InspectionStatus = "REQUESTED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
InspectorStatus = "PENDING" | "APPROVED" | "REJECTED"

// Loan
LoanStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED"
NBFC = "BAJAJ_FINSERV" | "HDFC_BANK" | "ICICI_BANK" | ... // 10 options

// Payout
PayoutStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"

// Community
Community = "BUYER" | "DEALER"
```

---

## Authentication & Authorization

### Session Management

Wheewise uses **NextAuth v5** with Credentials provider (email/password or phone OTP).

#### Check current user (client-side)
```typescript
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Spinner />;
  if (!session) return <SignInPrompt />;
  
  const user = session.user;
  console.log(user.id, user.email, user.role);
  return <div>Hello, {user.name}</div>;
}
```

#### Check server-side (Server Component or Action)
```typescript
import { auth } from "@/lib/auth";

export default async function MyServerComponent() {
  const session = await auth();
  if (!session) return <AccessDenied />;
  
  const userId = session.user.id;
  const role = session.user.role;
  return <div>Your ID: {userId}</div>;
}
```

### Role-Based Access Control (RBAC)

```typescript
// Helper: lib/auth.ts
export async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role) throw new Error("Forbidden");
  return user;
}

// In a server action:
export async function createListing(data: ListingInput) {
  const user = await requireRole("DEALER");
  const dealer = await db.dealer.findUnique({
    where: { userId: user.id },
  });
  if (!dealer) throw new Error("User is not a dealer");
  
  return db.listing.create({
    data: { ...data, dealerId: dealer.id },
  });
}
```

### OTP-based Authentication (Phone-Only Users)

```typescript
// Send OTP: POST /api/auth/send-otp
const response = await fetch("/api/auth/send-otp", {
  method: "POST",
  body: JSON.stringify({ phone: "+919876543210" }),
});

// Verify OTP + sign in:
import { signIn } from "next-auth/react";
const result = await signIn("credentials", {
  phone: "+919876543210",
  otp: "123456",
  redirect: false,
});
```

---

## Server Actions & API Routes

### Server Actions (Preferred for Most Cases)

Server actions are TypeScript functions that run on the server and are callable from client components.

#### Pattern: lib/actions/listings.ts

```typescript
"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createListingSchema } from "@/lib/validators/listing";

export async function createListing(data: unknown) {
  // 1. Validate input
  const parsed = createListingSchema.parse(data);
  
  // 2. Check auth
  const user = await requireRole("DEALER");
  const dealer = await db.dealer.findUnique({
    where: { userId: user.id },
  });
  if (!dealer) throw new Error("User is not a dealer");
  
  // 3. Create record
  const listing = await db.listing.create({
    data: {
      ...parsed,
      dealerId: dealer.id,
    },
    include: {
      photos: true,
      dealer: true,
    },
  });
  
  // 4. Return result (serializable)
  return listing;
}
```

#### Pattern: Client usage

```typescript
"use client";

import { createListing } from "@/lib/actions/listings";
import { useFormStatus } from "react-dom";
import { useTransition } from "react";

export function NewListingForm() {
  const [isPending, startTransition] = useTransition();
  
  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await createListing({
          make: formData.get("make"),
          model: formData.get("model"),
          year: formData.get("year"),
          // ...
        });
        toast.success("Listing created!");
      } catch (error) {
        toast.error(error.message);
      }
    });
  }
  
  return (
    <form action={onSubmit}>
      {/* ... */}
      <button disabled={isPending}>
        {isPending ? "Creating..." : "Create Listing"}
      </button>
    </form>
  );
}
```

### API Routes (for webhooks or external integrations)

API routes live in `app/api/` and are automatically routed.

#### Pattern: app/api/listings/route.ts

```typescript
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const listings = await db.listing.findMany({
      where: { status: "ACTIVE" },
      include: { photos: true },
      take: 20,
    });
    
    return NextResponse.json(listings);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const data = await request.json();
  // ... validate & create ...
  
  return NextResponse.json(newListing, { status: 201 });
}
```

---

## Common Data Fetching Patterns

### Server Component (preferred for SEO & data privacy)

```typescript
// app/vehicle/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetail({ params }: Props) {
  const { id } = await params;
  
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      dealer: {
        include: { store: true },
      },
      photos: { orderBy: { sortOrder: "asc" } },
      photos360: { orderBy: { angle: "asc" } },
      inspections: {
        where: { status: "COMPLETED" },
        take: 1,
      },
      enquiries: { take: 5 }, // Why this? Usually for admin context only
    },
  });
  
  if (!listing) notFound();
  
  // Now render
  return <VehicleDetailView listing={listing} />;
}
```

### Client Component (for interactive features)

```typescript
"use client";

import { useEffect, useState } from "react";

export function RecentListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch("/api/listings?limit=10&sort=recent")
      .then(r => r.json())
      .then(data => setListings(data))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <Spinner />;
  return listings.map(l => <ListingCard key={l.id} listing={l} />);
}
```

### Invalidate Cache After Mutation

```typescript
"use server";

import { revalidatePath } from "next/cache";

export async function saveToWishlist(listingId: string) {
  const user = await requireAuth();
  
  await db.savedListing.create({
    data: { userId: user.id, listingId },
  });
  
  // Revalidate the listing page & browse page
  revalidatePath(`/vehicle/${listingId}`);
  revalidatePath("/browse");
}
```

---

## Working with Prisma

### Query Examples

#### Fetch a listing with all related data
```typescript
const listing = await db.listing.findUnique({
  where: { id: "..." },
  include: {
    dealer: {
      include: { store: true, subscription: true },
    },
    photos: { orderBy: { sortOrder: "asc" } },
    inspections: {
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 1,
    },
    savedBy: { select: { userId: true } }, // Just IDs, not full User
  },
});
```

#### Search listings
```typescript
const results = await db.listing.findMany({
  where: {
    status: "ACTIVE",
    city: "Bangalore",
    vehicleType: "CAR",
    askingPrice: {
      gte: 300000,
      lte: 1500000,
    },
    isBoosted: true,
  },
  orderBy: { boostExpiresAt: "desc" }, // Boosted first
  take: 20,
  skip: 0, // Pagination
});
```

#### Count with conditions
```typescript
const activeCount = await db.listing.count({
  where: {
    dealerId: "...",
    status: "ACTIVE",
  },
});
```

#### Create with nested relations
```typescript
const listing = await db.listing.create({
  data: {
    dealerId: "...",
    make: "Maruti",
    model: "Swift",
    year: 2022,
    vehicleType: "CAR",
    fuelType: "PETROL",
    odometerKm: 45000,
    askingPrice: 650000,
    city: "Mumbai",
    description: "Well-maintained, single owner",
    photos: {
      createMany: {
        data: [
          { url: "https://r2.../photo1.jpg", sortOrder: 0 },
          { url: "https://r2.../photo2.jpg", sortOrder: 1 },
        ],
      },
    },
  },
  include: { photos: true },
});
```

#### Update with nested operations
```typescript
const listing = await db.listing.update({
  where: { id: "..." },
  data: {
    status: "SOLD",
    // Add a new photo
    photos: {
      create: { url: "...", sortOrder: 2 },
    },
    // Or connect existing
    inspections: {
      connect: { id: "inspection-id" },
    },
  },
  include: { photos: true, inspections: true },
});
```

#### Delete cascade
```typescript
// Deleting a Dealer cascades: deletes all listings, enquiries, etc.
await db.dealer.delete({
  where: { id: "..." },
});
```

### Decimal Handling

Prices are stored as `Decimal`. Always convert to number or string for JSON:

```typescript
const listing = await db.listing.findUnique({ where: { id: "..." } });

console.log(listing.askingPrice);        // Decimal object
console.log(listing.askingPrice.toNumber());  // 650000
console.log(listing.askingPrice.toString()); // "650000"

// When returning from an API or server action, the serializer
// will convert Decimal → string automatically in JSON.
return NextResponse.json(listing);  // ✅ Works
```

---

## Error Handling

### Validation Errors (Zod)

```typescript
import { z } from "zod";

const listingSchema = z.object({
  make: z.string().min(1, "Make is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  askingPrice: z.number().positive("Price must be > 0"),
});

export async function createListing(data: unknown) {
  try {
    const parsed = listingSchema.parse(data);
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return field-level errors
      return {
        success: false,
        errors: error.flatten().fieldErrors, // { make: ["..."], year: ["..."] }
      };
    }
    throw error;
  }
}
```

### Auth Errors

```typescript
export async function someProtectedAction() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized: Please sign in");
  }
  
  // Or redirect
  if (!session) {
    redirect("/login");
  }
}
```

### Database Errors

```typescript
import { Prisma } from "@prisma/client";

export async function createDealer(userId: string, data: unknown) {
  try {
    return await db.dealer.create({
      data: { userId, ...data },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint violation
        throw new Error(`${error.meta.target[0]} already exists`);
      }
      if (error.code === "P2025") {
        // Record not found
        throw new Error("Dealer not found");
      }
    }
    throw error;
  }
}
```

---

## Real-World Examples

### Example 1: Browse Listings Page

```typescript
// app/browse/page.tsx
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listings/ListingCard";

interface SearchParams {
  city?: string;
  vehicleType?: "CAR" | "BIKE";
  minPrice?: string;
  maxPrice?: string;
  sort?: "recent" | "price-asc" | "price-desc" | "boosted";
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
  };

  if (searchParams.city) where.city = searchParams.city;
  if (searchParams.vehicleType) where.vehicleType = searchParams.vehicleType;
  
  if (searchParams.minPrice || searchParams.maxPrice) {
    where.askingPrice = {};
    if (searchParams.minPrice) {
      where.askingPrice.gte = parseInt(searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      where.askingPrice.lte = parseInt(searchParams.maxPrice);
    }
  }

  const orderBy: any = {};
  switch (searchParams.sort) {
    case "price-asc":
      orderBy.askingPrice = "asc";
      break;
    case "price-desc":
      orderBy.askingPrice = "desc";
      break;
    case "boosted":
      orderBy.boostExpiresAt = "desc";
      orderBy.createdAt = "desc";
      break;
    default:
      orderBy.createdAt = "desc";
  }

  const listings = await db.listing.findMany({
    where,
    orderBy,
    include: { photos: { take: 1 } },
    take: 20,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

### Example 2: Submit Lead (Enquiry)

```typescript
// lib/actions/listings.ts
"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { auth } from "@/lib/auth";

const enquirySchema = z.object({
  listingId: z.string(),
  buyerName: z.string().min(1),
  buyerPhone: z.string().regex(/^\+?[0-9]{10,}$/),
  buyerEmail: z.string().email().optional(),
  message: z.string().optional(),
});

export async function submitEnquiry(data: unknown) {
  const parsed = enquirySchema.parse(data);
  const session = await auth();

  // Get listing + dealer
  const listing = await db.listing.findUniqueOrThrow({
    where: { id: parsed.listingId },
    include: { dealer: true },
  });

  // Create enquiry
  const enquiry = await db.enquiry.create({
    data: {
      listingId: parsed.listingId,
      dealerId: listing.dealerId,
      buyerId: session?.user?.id,
      buyerName: parsed.buyerName,
      buyerPhone: parsed.buyerPhone,
      buyerEmail: parsed.buyerEmail,
      message: parsed.message,
      source: "FORM",
    },
  });

  // Increment listing's enquiry count (alternative: use Prisma increment)
  await db.listing.update({
    where: { id: parsed.listingId },
    data: { enquiryCount: { increment: 1 } },
  });

  // Send email to dealer
  // await sendLeadNotificationEmail(listing.dealer.email, enquiry);

  return enquiry;
}
```

Client:
```typescript
"use client";

import { submitEnquiry } from "@/lib/actions/listings";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

export function EnquiryForm({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await submitEnquiry({
          listingId,
          buyerName: formData.get("name"),
          buyerPhone: formData.get("phone"),
          buyerEmail: formData.get("email"),
          message: formData.get("message"),
        });
        toast({
          title: "Enquiry submitted!",
          description: "The dealer will contact you soon.",
        });
        e.currentTarget.reset();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="tel"
        name="phone"
        placeholder="Your phone"
        required
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="email"
        name="email"
        placeholder="Your email (optional)"
        className="w-full px-3 py-2 border rounded"
      />
      <textarea
        name="message"
        placeholder="Message to dealer..."
        rows={3}
        className="w-full px-3 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit Enquiry"}
      </button>
    </form>
  );
}
```

### Example 3: Dealer Dashboard (Chat List)

```typescript
// app/(dealer)/dashboard/chat/page.tsx
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const dealer = await db.dealer.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  // Fetch conversations sorted by last message
  const conversations = await db.conversation.findMany({
    where: { dealerId: dealer.id },
    include: {
      buyer: { select: { id: true, name: true, phone: true } },
      listing: { select: { id: true, make: true, model: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <div className="space-y-4">
      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet</p>
      ) : (
        conversations.map((conv) => (
          <a
            key={conv.id}
            href={`/dealer/chat/${conv.id}`}
            className="block p-4 border rounded hover:shadow-md"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">{conv.buyer.name}</h3>
                <p className="text-sm text-gray-600">
                  {conv.listing.make} {conv.listing.model}
                </p>
                {conv.messages[0] && (
                  <p className="text-sm mt-2 truncate">
                    {conv.messages[0].body}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(conv.lastMessageAt).toLocaleDateString()}
              </span>
            </div>
          </a>
        ))
      )}
    </div>
  );
}
```

### Example 4: Save to Wishlist (Client Action)

```typescript
// lib/actions/listings.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function toggleSaveListing(listingId: string) {
  const session = await auth();
  if (!session) throw new Error("Please sign in");

  try {
    // Try to save (will fail if already saved due to unique constraint)
    await db.savedListing.create({
      data: {
        userId: session.user.id,
        listingId,
      },
    });
    return { saved: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Already saved, so delete it
      await db.savedListing.delete({
        where: {
          userId_listingId: {
            userId: session.user.id,
            listingId,
          },
        },
      });
      return { saved: false };
    }
    throw error;
  }
}
```

Client:
```typescript
"use client";

import { toggleSaveListing } from "@/lib/actions/listings";
import { useState } from "react";
import { Heart } from "lucide-react";

export function SaveButton({
  listingId,
  initialSaved,
}: {
  listingId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await toggleSaveListing(listingId);
      setSaved(result.saved);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <Heart
        size={20}
        className={saved ? "fill-red-500 text-red-500" : "text-gray-400"}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
```

---

## Quick Reference: Common Tasks

| Task | Where | Method |
|------|-------|--------|
| Fetch listings | Server Component | `db.listing.findMany()` |
| Create listing | Server Action | `db.listing.create()` |
| Update listing | Server Action | `db.listing.update()` |
| Check if user owns item | Server Action | Compare `userId` with `user.id` |
| Increment view count | Server Action | `db.listing.update({ data: { viewCount: { increment: 1 } } })` |
| Get dealer profile | Server Component | `db.dealer.findUnique({ where: { userId } })` |
| Submit enquiry | Server Action | `db.enquiry.create()` |
| Fetch user's saved listings | Server Component | `db.savedListing.findMany({ where: { userId } })` |
| Send email | Server Action (via API route) | `await resend.emails.send()` |
| Webhook verification | API route | Hash signature & compare |

---

## Debugging Tips

### Print all queries (dev only)
```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"], // Add this
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### Check session in browser
```typescript
import { getSession } from "next-auth/react";

// In client component
const session = await getSession();
console.log(session);
```

### View database directly
```bash
npx prisma studio
# Opens http://localhost:5555
```

---

**Last updated: 2026-05-29**

Need help? Check the type definitions:
- `node_modules/@prisma/client/index.d.ts` for schema types
- Check `/lib/validators/*.ts` for accepted input shapes
