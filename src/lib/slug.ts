import { prisma } from './prisma';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^\w\-]+/g, '') // Remove non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim leading hyphens
    .replace(/-+$/, ''); // Trim trailing hyphens
}

export async function generateUniqueSlug(baseName: string, explicitSlug?: string): Promise<string> {
  const base = slugify(explicitSlug || baseName) || 'business';
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) {
      return slug;
    }
    slug = `${base}-${counter}`;
    counter++;
  }
}
