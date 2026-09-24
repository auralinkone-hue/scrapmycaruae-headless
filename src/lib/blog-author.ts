import { wixClient } from './wix';

export type BlogAuthor = {
  name: string;
  photoUrl: string;
};

export async function getBlogAuthor(post: any): Promise<BlogAuthor | null> {
  if (!post?.memberId) return null;

  try {
    const member = await wixClient.members.getMember(post.memberId, {
      fieldsets: ['PUBLIC']
    });

    return {
      name: member?.profile?.nickname || '-',
      photoUrl: member?.profile?.photo?.url || ''
    };
  } catch {
    return null;
  }
}
