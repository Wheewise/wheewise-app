import {
  getAllPosts,
  togglePinPost,
  toggleLockPost,
  deletePost,
} from "@/lib/actions/community";
import { Button } from "@/components/ui/Field";

export default async function AdminCommunityPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Community Moderation</h1>

      <div className="border-border-default bg-background rounded-lg border">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No posts yet.</div>
        ) : (
          <ul className="divide-border-default divide-y">
            {posts.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{p.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                        p.community === "DEALER"
                          ? "bg-zinc-100 text-zinc-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {p.community}
                    </span>
                    {p.isPinned ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        Pinned
                      </span>
                    ) : null}
                    {p.isLocked ? (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        Locked
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {p.author.name ?? p.author.email} · {p._count.replies} replies ·{" "}
                    {p._count.upvotes} upvotes
                  </div>
                </div>
                <div className="flex gap-1">
                  <form
                    action={async () => {
                      "use server";
                      await togglePinPost(p.id);
                    }}
                  >
                    <Button className="text-[10px]">
                      {p.isPinned ? "Unpin" : "Pin"}
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await toggleLockPost(p.id);
                    }}
                  >
                    <Button className="text-[10px]">
                      {p.isLocked ? "Unlock" : "Lock"}
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deletePost(p.id);
                    }}
                  >
                    <Button className="bg-red-600 text-[10px] hover:bg-red-700">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
