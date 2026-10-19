import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

// Manually read .env to avoid external dependencies
async function loadEnv() {
  try {
    const content = await fs.readFile('.env', 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
}

async function uploadFile(localPath, folder, publicId) {
  const fullPath = path.join(process.cwd(), localPath);
  console.log(`Uploading ${localPath} -> ${folder}/${publicId}...`);
  
  const result = await cloudinary.uploader.upload(fullPath, {
    folder,
    public_id: publicId,
    resource_type: 'auto',
    overwrite: true,
  });

  console.log(`  ✓ Uploaded: ${result.secure_url}`);
  return result.secure_url;
}

async function main() {
  await loadEnv();

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Error: Cloudinary credentials missing in environment.');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  const urlMap = {};

  // 1. Gallery assets
  const galleryDir = path.join(process.cwd(), 'public', 'gallery');
  try {
    const galleryFiles = await fs.readdir(galleryDir);
    for (const file of galleryFiles) {
      const localRel = `public/gallery/${file}`;
      const webPath = `/gallery/${file}`;
      const baseName = path.parse(file).name;
      const url = await uploadFile(localRel, 'nexora/gallery', baseName);
      urlMap[webPath] = url;
    }
  } catch (err) {
    console.warn('Gallery dir error:', err.message);
  }

  // 2. Events assets
  const eventsDir = path.join(process.cwd(), 'public', 'events');
  try {
    const eventFiles = await fs.readdir(eventsDir);
    for (const file of eventFiles) {
      const localRel = `public/events/${file}`;
      const webPath = `/events/${file}`;
      const baseName = path.parse(file).name;
      const url = await uploadFile(localRel, 'nexora/events', baseName);
      urlMap[webPath] = url;
    }
  } catch (err) {
    console.warn('Events dir error:', err.message);
  }

  // 3. Campus & other assets used in gallery
  const extraAssets = [
    { localRel: 'public/faculty/lab-classroom.jpg', webPath: '/faculty/lab-classroom.jpg', folder: 'nexora/campus', id: 'lab-classroom' },
    { localRel: 'public/ajiet.jpg', webPath: '/ajiet.jpg', folder: 'nexora/campus', id: 'ajiet-campus' },
    { localRel: 'public/heika.jpeg', webPath: '/heika.jpeg', folder: 'nexora/brand', id: 'heika' },
    { localRel: 'public/logo.jpg', webPath: '/logo.jpg', folder: 'nexora/brand', id: 'logo' },
    { localRel: 'public/logo-navbar.png', webPath: '/logo-navbar.png', folder: 'nexora/brand', id: 'logo-navbar' },
  ];

  for (const asset of extraAssets) {
    try {
      const url = await uploadFile(asset.localRel, asset.folder, asset.id);
      urlMap[asset.webPath] = url;
    } catch (err) {
      console.warn(`Error uploading ${asset.localRel}:`, err.message);
    }
  }

  // 4. Save mapping file
  const mapPath = path.join(process.cwd(), 'lib', 'data', 'cloudinary-map.json');
  await fs.mkdir(path.dirname(mapPath), { recursive: true });
  await fs.writeFile(mapPath, JSON.stringify(urlMap, null, 2), 'utf-8');
  console.log(`Saved Cloudinary URL map to ${mapPath}`);

  // 5. Update lib/home-gallery.ts
  const galleryFilePath = path.join(process.cwd(), 'lib', 'home-gallery.ts');
  let galleryContent = await fs.readFile(galleryFilePath, 'utf-8');
  let galleryReplacements = 0;
  for (const [localWeb, cloudUrl] of Object.entries(urlMap)) {
    const target = `src: '${localWeb}'`;
    if (galleryContent.includes(target)) {
      galleryContent = galleryContent.replaceAll(target, `src: '${cloudUrl}'`);
      galleryReplacements++;
    }
  }
  await fs.writeFile(galleryFilePath, galleryContent, 'utf-8');
  console.log(`Updated lib/home-gallery.ts with ${galleryReplacements} Cloudinary URLs.`);

  // 6. Update lib/data/initial-events.ts
  const eventsFilePath = path.join(process.cwd(), 'lib', 'data', 'initial-events.ts');
  let eventsContent = await fs.readFile(eventsFilePath, 'utf-8');
  let eventsReplacements = 0;
  for (const [localWeb, cloudUrl] of Object.entries(urlMap)) {
    const target = `imageUrl: '${localWeb}'`;
    if (eventsContent.includes(target)) {
      eventsContent = eventsContent.replaceAll(target, `imageUrl: '${cloudUrl}'`);
      eventsReplacements++;
    }
  }
  await fs.writeFile(eventsFilePath, eventsContent, 'utf-8');
  console.log(`Updated lib/data/initial-events.ts with ${eventsReplacements} Cloudinary URLs.`);

  console.log('\n✨ All gallery and event assets successfully uploaded and linked to Cloudinary!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

