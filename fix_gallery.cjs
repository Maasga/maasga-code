const fs = require('fs');
const f = 'C:/Users/sayta/Downloads/Telegram Desktop/maasga-code/src/index.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Remplacer uploadToImgBB pour retourner {url, deleteUrl}
const oldFn = sync function uploadToImgBB(apiKey: string, fileBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(fileBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  const form = new FormData()
  form.append('key', apiKey)
  form.append('image', base64)
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('ImgBB upload failed: ' + res.status)
  const json = await res.json() as any
  if (!json?.data?.url) throw new Error('ImgBB: no URL in response')
  return json.data.url as string
};

const newFn = sync function uploadToImgBB(apiKey: string, fileBuffer: ArrayBuffer, mimeType: string): Promise<{url: string, deleteUrl: string}> {
  const bytes = new Uint8Array(fileBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  const form = new FormData()
  form.append('key', apiKey)
  form.append('image', base64)
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('ImgBB upload failed: ' + res.status)
  const json = await res.json() as any
  if (!json?.data?.url) throw new Error('ImgBB: no URL in response')
  return { url: json.data.url as string, deleteUrl: (json.data.delete_url || '') as string }
};

if (c.includes(oldFn)) { c = c.replace(oldFn, newFn); console.log('fn: OK'); }
else { console.log('fn: FAIL - pattern not found'); }

// 2. Fixer les appels qui utilisent uploadedUrl (route image update)
// Chercher "uploadedUrl = await uploadToImgBB" et ajouter .url
c = c.replace(
  'uploadedUrl = await uploadToImgBB(imgbbKey, buffer, file.type)',
  'const imgbbResult = await uploadToImgBB(imgbbKey, buffer, file.type)\n    uploadedUrl = imgbbResult.url\n    const imgbbDeleteUrl = imgbbResult.deleteUrl'
);

// Stocker imgbbDeleteUrl en DB dans la route update
c = c.replace(
  "const res = await db.prepare('UPDATE products SET imageUrl = ? WHERE id = ?').bind(uploadedUrl, id).run()",
  "const res = await db.prepare('UPDATE products SET imageUrl = ?, imgbb_delete_url = ? WHERE id = ?').bind(uploadedUrl, imgbbDeleteUrl, id).run()"
);

// Mettre à jour le cache mémoire aussi
c = c.replace(
  'if (product) (product as any).imageUrl = uploadedUrl\n    else if (!db) return c.redirect(\'/admin/produits?error=\' + encodeURIComponent(\'Produit introuvable.\'))',
  'if (product) { (product as any).imageUrl = uploadedUrl; (product as any).imgbbDeleteUrl = imgbbDeleteUrl }\n    else if (!db) return c.redirect(\'/admin/produits?error=\' + encodeURIComponent(\'Produit introuvable.\'))'
);

// 3. Fixer la route création produit
c = c.replace(
  'imageUrl = await uploadToImgBB(imgbbKey2, buffer, file.type)',
  'const imgbbResult2 = await uploadToImgBB(imgbbKey2, buffer, file.type)\n      imageUrl = imgbbResult2.url\n      imgbbDeleteUrlCreate = imgbbResult2.deleteUrl'
);

// Ajouter la déclaration de imgbbDeleteUrlCreate avant le bloc upload
c = c.replace(
  '  // Upload vers ImgBB\n    const imgbbKey2',
  '  let imgbbDeleteUrlCreate = \'\'\n    // Upload vers ImgBB\n    const imgbbKey2'
);

// Dans l'INSERT products, ajouter imgbb_delete_url
c = c.replace(
  "'❄️', imageUrl || null, techSpecsJson,",
  "'❄️', imageUrl || null, imgbbDeleteUrlCreate || null, techSpecsJson,"
);
// Et la colonne dans l'INSERT
c = c.replace(
  'INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, tech_specs, media_urls)',
  'INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, imgbb_delete_url, tech_specs, media_urls)'
);

fs.writeFileSync(f, c, 'utf8');
console.log('Saved');