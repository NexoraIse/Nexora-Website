import fs from 'node:fs/promises';
import path from 'node:path';
import { ALL_GALLERY_ITEMS, type GalleryItem } from './home-gallery';

const DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'custom-gallery.json');

/**
 * Read custom gallery items added by administrators from disk.
 */
export async function getCustomGalleryItems(): Promise<GalleryItem[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.warn('Could not read custom-gallery.json:', error.message);
    }
    return [];
  }
}

/**
 * Returns all gallery items: newly added custom items first, followed by default seeded items.
 */
export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  const custom = await getCustomGalleryItems();
  const customIds = new Set(custom.map((item) => item.id));
  const remainingDefaults = ALL_GALLERY_ITEMS.filter((item) => !customIds.has(item.id));
  return [...custom, ...remainingDefaults];
}

/**
 * Distributes all gallery items evenly across 4 rows for the homepage marquee.
 */
export async function getAllGalleryRows(): Promise<GalleryItem[][]> {
  const allItems = await getAllGalleryItems();
  const rows: GalleryItem[][] = [[], [], [], []];

  allItems.forEach((item, index) => {
    rows[index % 4].push(item);
  });

  return rows;
}

/**
 * Adds a new gallery item, persisting it to lib/data/custom-gallery.json.
 */
export async function saveCustomGalleryItem(
  item: Omit<GalleryItem, 'id'> & { id?: string }
): Promise<GalleryItem> {
  const custom = await getCustomGalleryItems();
  const newItem: GalleryItem = {
    id: item.id || `gal-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: item.title.trim(),
    caption: item.caption.trim(),
    category: item.category.trim() || 'General',
    date: item.date.trim() || '2026',
    location: item.location?.trim() || undefined,
    src: item.src.trim(),
    alt: item.alt.trim() || item.title.trim(),
    aspectRatio: item.aspectRatio || 'aspect-[16/9]',
    width: item.width || 800,
    height: item.height || 450,
  };

  const updated = [newItem, ...custom.filter((existing) => existing.id !== newItem.id)];

  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');

  return newItem;
}

/**
 * Deletes a gallery item by id.
 */
export async function deleteCustomGalleryItem(id: string): Promise<boolean> {
  const custom = await getCustomGalleryItems();
  const filtered = custom.filter((item) => item.id !== id);
  if (filtered.length === custom.length) {
    return false;
  }

  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

