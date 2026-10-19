/**
 * =============================================================================
 * NEXORA CLUB - HOMEPAGE GALLERY DATA CONFIGURATION
 * =============================================================================
 * 
 * Maintainer Guide:
 * Gallery items are managed dynamically via the Admin Dashboard (/admin -> Photo Gallery)
 * and hosted directly on Cloudinary.
 * 
 * Rows alternate animation directions:
 * - Row 1 & Row 3: Move from Right to Left
 * - Row 2 & Row 4: Move from Left to Right
 */

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  date: string;
  location?: string;
  src: string;
  alt: string;
  aspectRatio: string;
  width: number;
  height: number;
}

export const GALLERY_ROWS: GalleryItem[][] = [[], [], [], []];

/**
 * Flattened list of all gallery items for fast indexed lookup during Lightbox modal navigation.
 */
export const ALL_GALLERY_ITEMS: GalleryItem[] = [];
