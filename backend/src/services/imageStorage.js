const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');
const sharp = require('sharp');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
let client;

function storage() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw httpError(503, 'Image storage is not configured on the server.');
  }
  client ??= createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.storage.from(config.supabaseBucket);
}

function detectImage(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', type: 'image/png' };
  }
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp', type: 'image/webp' };
  }
  return null;
}

async function uploadMenuImage(file) {
  if (!detectImage(file.buffer)) throw httpError(400, 'That file is not a valid JPEG, PNG, or WEBP image.');

  let data;
  try {
    data = await sharp(file.buffer)
      .rotate()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw httpError(400, "That image couldn't be read. Try a different file.");
  }

  const objectPath = `menu-items/${crypto.randomUUID()}.webp`; // never use the user's file name
  const bucket = storage();
  const { error } = await bucket.upload(objectPath, data, {
    contentType: 'image/webp', cacheControl: '31536000', upsert: false,
  });
  if (error) {
    console.error('Image upload failed:', error.message);
    throw httpError(502, "Couldn't store the image. Try again.");
  }
  return bucket.getPublicUrl(objectPath).data.publicUrl;
}

async function removeMenuImage(url) {
  if (!url) return;
  try {
    const marker = `/object/public/${config.supabaseBucket}/`;
    if (url.includes(marker)) {
      await storage().remove([decodeURIComponent(url.split(marker)[1])]);
    } else if (url.startsWith('/uploads/menu-items/')) {
      fs.unlink(path.join(__dirname, '..', '..', 'uploads', 'menu-items', path.basename(url)), () => {});
    }
  } catch (err) {
    console.warn('Could not remove image:', err.message);
  }
}

module.exports = { uploadMenuImage, removeMenuImage };