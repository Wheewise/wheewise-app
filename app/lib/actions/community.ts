"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function createPost(
  community: "BUYER" | "DEALER",
  title: string,
  body: string,
  tags: string[],
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.post.create({
    data: { title, body, authorId: session.user.id, community, tags },
  });

  const path = community === "DEALER" ? "/forum/dealer" : "/community";
  revalidatePath(path);
  return { ok: true };
}

export async function getPosts(community: "BUYER" | "DEALER") {
  return prisma.post.findMany({
    where: { community },
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { replies: true, upvotes: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPost(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { upvotes: true } },
      replies: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createReply(postId: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isLocked: true, community: true },
  });
  if (!post) throw new Error("Post not found");
  if (post.isLocked) throw new Error("This discussion is locked");

  await prisma.reply.create({
    data: { postId, authorId: session.user.id, body },
  });

  const path =
    post.community === "DEALER" ? `/forum/dealer/${postId}` : `/community/${postId}`;
  revalidatePath(path);
  return { ok: true };
}

export async function upvotePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.postUpvote.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });
  if (existing) {
    await prisma.postUpvote.delete({ where: { id: existing.id } });
  } else {
    await prisma.postUpvote.create({
      data: { postId, userId: session.user.id },
    });
  }

  revalidatePath(`/community/${postId}`);
  revalidatePath(`/forum/dealer/${postId}`);
  return { ok: true };
}

// --- Admin ---

export async function togglePinPost(postId: string) {
  await requireAdmin();
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isPinned: true },
  });
  if (!post) return;
  await prisma.post.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
  });
  revalidatePath("/admin/community");
}

export async function toggleLockPost(postId: string) {
  await requireAdmin();
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isLocked: true },
  });
  if (!post) return;
  await prisma.post.update({
    where: { id: postId },
    data: { isLocked: !post.isLocked },
  });
  revalidatePath("/admin/community");
}

export async function deletePost(postId: string) {
  await requireAdmin();
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin/community");
}

export async function getAllPosts() {
  await requireAdmin();
  return prisma.post.findMany({
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { replies: true, upvotes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}
