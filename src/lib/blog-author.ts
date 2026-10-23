import { wixClient } from './wix';
import { blogLoadErrorStatus } from './blog-load-status';

export type BlogAuthor = {
  id: string;
  name: string;
  photoUrl: string;
  slug: string;
  about?: string;
};

const safeMemberId = (value: unknown) => {
  const id = typeof value === 'string' ? value.trim() : '';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : '';
};

const safeProfileSlug = (value: unknown) => {
  const slug = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug) ? slug : '';
};

const fallbackSlug = (memberId: string) => memberId ? `member-${memberId}` : '';

const fallbackMemberId = (slug: string) => {
  const match = /^member-([0-9a-f-]{36})$/i.exec(slug);
  return match ? safeMemberId(match[1]) : '';
};

const richContentText = (richContent: any) => {
  const pieces: string[] = [];
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node?.textData?.text === 'string') pieces.push(node.textData.text);
    if (Array.isArray(node.nodes)) node.nodes.forEach(visit);
  };

  if (Array.isArray(richContent?.nodes)) richContent.nodes.forEach(visit);
  return pieces.join(' ').replace(/\s+/g, ' ').trim().slice(0, 600);
};

async function getPublicAbout(memberId: string): Promise<string | undefined> {
  try {
    const result = await wixClient.membersAbout
      .queryMemberAbouts()
      .eq('memberId', memberId)
      .limit(1)
      .find();
    const about = richContentText(result.items?.[0]?.content);
    return about || undefined;
  } catch {
    // A public profile remains useful even when the optional About API is unavailable.
    return undefined;
  }
}

async function authorFromMember(member: any, includeAbout = true): Promise<BlogAuthor | null> {
  const id = safeMemberId(member?._id);
  const name = typeof member?.profile?.nickname === 'string'
    ? member.profile.nickname.trim()
    : '';
  if (!id || !name) return null;

  const about = includeAbout ? await getPublicAbout(id) : undefined;
  return {
    id,
    name,
    photoUrl: typeof member?.profile?.photo?.url === 'string' ? member.profile.photo.url : '',
    slug: safeProfileSlug(member?.profile?.slug) || fallbackSlug(id),
    ...(about ? { about } : {})
  };
}

export async function getBlogAuthor(
  post: any,
  { includeAbout = true }: { includeAbout?: boolean } = {}
): Promise<BlogAuthor | null> {
  const memberId = safeMemberId(post?.memberId);
  if (!memberId) return null;

  try {
    const member = await wixClient.members.getMember(memberId, {
      fieldsets: ['PUBLIC']
    });
    return authorFromMember(member, includeAbout);
  } catch {
    return null;
  }
}

/** Resolves either a public Wix profile slug or our safe member-ID fallback. */
export async function getBlogAuthorBySlug(value: unknown): Promise<BlogAuthor | null> {
  const slug = safeProfileSlug(value);
  if (!slug) return null;

  try {
    const memberId = fallbackMemberId(slug);
    if (memberId) {
      const member = await wixClient.members.getMember(memberId, { fieldsets: ['PUBLIC'] });
      const author = await authorFromMember(member);
      if (!author) throw new Error('Malformed Wix author response.');
      return author;
    }

    const result = await wixClient.members
      .queryMembers({ fieldsets: ['PUBLIC'] })
      .eq('profile.slug', slug)
      .limit(1)
      .find();
    if (!Array.isArray(result?.items)) throw new Error('Malformed Wix author query response.');
    if (result.items.length === 0) return null;
    const author = await authorFromMember(result.items[0]);
    if (!author) throw new Error('Malformed Wix author response.');
    return author;
  } catch (error) {
    if (blogLoadErrorStatus(error) === 404) return null;
    throw error;
  }
}
