import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/actions/community";
import { PostReplies } from "./PostReplies";
import { UpvoteButton } from "./UpvoteButton";

type Params = Promise<{ id: string }>;

export default async function CommunityPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/community" className="hover:text-foreground text-sm text-zinc-500">
          ← Community
        </Link>

        <article className="border-border-default bg-background mt-4 rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{post.title}</h1>
              <p className="mt-1 text-xs text-zinc-500">
                {post.author.name ?? post.author.email} ·{" "}
                {new Date(post.createdAt).toLocaleDateString("en-IN")}
                {post.isLocked ? " · Locked" : ""}
              </p>
            </div>
            <UpvoteButton postId={post.id} count={post._count.upvotes} />
          </div>
          <div className="mt-4 text-sm whitespace-pre-wrap text-zinc-700">
            {post.body}
          </div>
          {post.tags.length > 0 ? (
            <div className="mt-4 flex gap-1">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="bg-surface-muted rounded px-1.5 py-0.5 text-[10px] text-zinc-600"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <PostReplies postId={post.id} isLocked={post.isLocked} replies={post.replies} />
      </div>
    </div>
  );
}
