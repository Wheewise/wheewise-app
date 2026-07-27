import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { Logo } from "@/components/brand/Logo";
import { ReplyForm } from "./ReplyForm";

type Params = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Awaiting reply",
  REPLIED: "Dealer replied",
  CLOSED: "Closed",
};

export default async function MyEnquiryDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/my-enquiries/${id}`)}`);
  }

  const enquiry = await prisma.enquiry.findFirst({
    where: { id, buyerId: session.user.id },
    include: {
      listing: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          askingPrice: true,
          photos: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
      dealer: { select: { businessName: true } },
    },
  });
  if (!enquiry) notFound();

  const conversation = await prisma.conversation.findUnique({
    where: { listingId_buyerId: { listingId: enquiry.listingId, buyerId: session.user.id } },
  });

  const messages = conversation
    ? await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const unreadIds = messages
    .filter((m) => m.senderId !== session.user.id && !m.readAt)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    // updateMany runs as a multi-statement transaction, which the Cloudflare
    // Workers Neon HTTP adapter can't do (see lib/db.ts) — update each row
    // individually instead.
    const readAt = new Date();
    await Promise.all(
      unreadIds.map((id) => prisma.message.update({ where: { id }, data: { readAt } })),
    );
  }

  const vehicle = `${enquiry.listing.year} ${enquiry.listing.make} ${enquiry.listing.model}`;

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo variant="wordmark" size={26} href="/browse" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/my-enquiries" className="text-sm text-zinc-500 hover:text-white">
          ← Back to my enquiries
        </Link>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {enquiry.listing.photos[0] ? (
            <img
              src={enquiry.listing.photos[0].url}
              alt={vehicle}
              className="h-16 w-24 rounded-md object-cover"
            />
          ) : (
            <div className="h-16 w-24 rounded-md bg-zinc-800" />
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/vehicle/${enquiry.listing.id}`}
              className="font-semibold text-white hover:underline"
            >
              {vehicle}
            </Link>
            <div className="text-sm text-zinc-500">
              {formatINR(Number(enquiry.listing.askingPrice))} · {enquiry.dealer.businessName}
            </div>
          </div>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 uppercase">
            {STATUS_LABEL[enquiry.status] ?? enquiry.status}
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-3 text-sm font-semibold text-white">
            Conversation
          </div>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto p-5">
            {messages.map((m) => {
              const isMine = m.senderId === session.user.id;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isMine ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p
                      className={`mt-0.5 text-right text-[10px] ${
                        isMine ? "text-red-100" : "text-zinc-400"
                      }`}
                    >
                      {m.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <ReplyForm enquiryId={enquiry.id} />
        </div>
      </div>
    </div>
  );
}
