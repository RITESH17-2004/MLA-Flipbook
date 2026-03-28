import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'public', 'data');
const outputDir = path.join(__dirname, 'public', 'data-optimized');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
  try {
    const files = fs.readdirSync(inputDir);
    const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));
    
    console.log(`Found ${pngFiles.length} PNG images. Compressing to WebP...`);
    
    for (const file of pngFiles) {
      const inputPath = path.join(inputDir, file);
      // Keep the same number name, but change extension to .webp
      const newFileName = file.replace(/\.png$/i, '.webp');
      const outputPath = path.join(outputDir, newFileName);
      
      console.log(`Processing: ${file} -> ${newFileName}`);
      
      await sharp(inputPath)
        .resize({ width: 1600, withoutEnlargement: true }) // Perfect resolution for laptops
        .webp({ quality: 80 }) // Massive space savings, no visual loss
        .toFile(outputPath);
    }
    
    console.log('\nCompression complete! You can now safely push to GitHub.');
  } catch (error) {
    console.error('Error during compression:', error);
  }
}

processImages();
