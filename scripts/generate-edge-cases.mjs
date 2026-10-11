import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.resolve(__dirname, '../tests/fixtures/photos');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

  // 1. Blurry photo
  await page.setContent(`
    <body style="margin: 0; background: #e0e0e0; display: flex; align-items: center; justify-content: center; height: 100vh;">
      <div style="filter: blur(25px); width: 200px; height: 350px; background: radial-gradient(circle, #3b82f6, #1d4ed8); border-radius: 50px;"></div>
    </body>
  `);
  const blurryPath = path.join(photosDir, 'blurry-bottle.jpg');
  await page.screenshot({ path: blurryPath, type: 'jpeg', quality: 60 });
  console.log(`Generated: ${blurryPath}`);

  // 2. Photo with no item (empty background)
  await page.setContent(`
    <body style="margin: 0; background: linear-gradient(135deg, #d4a373 0%, #ccd5ae 100%); height: 100vh;">
      <div style="width: 100%; height: 100%; opacity: 0.1; background: repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px);"></div>
    </body>
  `);
  const noItemPath = path.join(photosDir, 'photo-no-item.jpg');
  await page.screenshot({ path: noItemPath, type: 'jpeg', quality: 80 });
  console.log(`Generated: ${noItemPath}`);

  // 3. Two items in one photo (Can + Apple / plastic bottle)
  await page.setContent(`
    <body style="margin: 0; background: #f8f9fa; display: flex; align-items: center; justify-content: center; height: 100vh; gap: 40px;">
      <div style="width: 140px; height: 260px; background: linear-gradient(to right, #e03131, #c92a2a, #ff8787); border-radius: 20px; box-shadow: 2px 8px 16px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: sans-serif;">SODA CAN</div>
      <div style="width: 180px; height: 180px; background: radial-gradient(circle, #fab005, #e67700); border-radius: 50%; box-shadow: 2px 8px 16px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: sans-serif;">FOOD WASTE</div>
    </body>
  `);
  const twoItemsPath = path.join(photosDir, 'two-items.jpg');
  await page.screenshot({ path: twoItemsPath, type: 'jpeg', quality: 85 });
  console.log(`Generated: ${twoItemsPath}`);

  // 4. Screenshot of text
  await page.setContent(`
    <body style="margin: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <h1 style="color: #111;">Municipal Waste Diversion Protocol 2026</h1>
      <p>Single-stream recycling programs consolidate paper, clean plastics #1-5 and #7, aluminum beverage containers, and clean glass jars into dedicated curbside receptacles. In contrast, film plastics, expanded polystyrene, and organics cause severe operational issues at material recovery facilities.</p>
      <p>Contamination remains the primary cost driver for municipal recycling systems nationwide.</p>
    </body>
  `);
  const textScreenshotPath = path.join(photosDir, 'screenshot-text.jpg');
  await page.screenshot({ path: textScreenshotPath, type: 'jpeg', quality: 90 });
  console.log(`Generated: ${textScreenshotPath}`);

  // 5. Very large image (large viewport 3840 x 2160)
  const largePage = await browser.newPage({ viewport: { width: 3840, height: 2160 } });
  await largePage.setContent(`
    <body style="margin: 0; background: radial-gradient(circle at center, #2b8a3e, #0b7285); height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="width: 800px; height: 1400px; background: rgba(255,255,255,0.8); border: 20px solid white; border-radius: 120px;"></div>
    </body>
  `);
  const largePath = path.join(photosDir, 'very-large-image.jpg');
  await largePage.screenshot({ path: largePath, type: 'jpeg', quality: 95 });
  console.log(`Generated: ${largePath} (${fs.statSync(largePath).size} bytes)`);
  await largePage.close();

  // 6. Photo taken sideways (rotated 90 degrees)
  await page.setContent(`
    <body style="margin: 0; background: #e9ecef; display: flex; align-items: center; justify-content: center; height: 100vh;">
      <div style="transform: rotate(90deg); width: 140px; height: 320px; background: linear-gradient(to right, #4c6ef5, #364fc7); border-radius: 20px; box-shadow: 4px 10px 20px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: sans-serif;">SIDEWAYS CAN</div>
    </body>
  `);
  const sidewaysPath = path.join(photosDir, 'sideways-can.jpg');
  await page.screenshot({ path: sidewaysPath, type: 'jpeg', quality: 85 });
  console.log(`Generated: ${sidewaysPath}`);

  // 7. HEIC file dummy (with HEIF / ftypheic container header)
  const heicPath = path.join(photosDir, 'test-sample.heic');
  const heicHeader = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x68, 0x65, 0x69, 0x63, 0x00, 0x00, 0x00, 0x00, // heic brand
    0x6d, 0x69, 0x66, 0x31, 0x68, 0x65, 0x69, 0x63  // compatible brands: mif1, heic
  ]);
  const heicPayload = Buffer.concat([heicHeader, Buffer.alloc(1024, 0xAA)]);
  fs.writeFileSync(heicPath, heicPayload);
  console.log(`Generated: ${heicPath} (${heicPayload.length} bytes)`);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
