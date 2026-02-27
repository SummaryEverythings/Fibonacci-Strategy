import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import Tesseract from 'tesseract.js';

async function testOCR() {
    console.log('Loading image...');
    const image = await loadImage('./chart.png');

    console.log(`Image dimensions: ${image.width}x${image.height}`);

    // Crop the right ~18% of the image (price scale region)
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    const cropX = Math.floor(image.width * 0.82);
    const cropWidth = image.width - cropX;

    canvas.width = cropWidth;
    canvas.height = image.height;

    ctx.drawImage(image, cropX, 0, cropWidth, image.height, 0, 0, cropWidth, image.height);

    // Preprocess: enhance contrast
    const imageData = ctx.getImageData(0, 0, cropWidth, image.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const enhanced = gray < 128 ? gray * 0.5 : 128 + (gray - 128) * 1.5;
        const val = enhanced > 140 ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    // Save debug image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./debug_ocr_crop.png', buffer);
    console.log('Saved cropped price scale to debug_ocr_crop.png');

    console.log('Running OCR...');
    const worker = await Tesseract.createWorker('eng', 1);
    const result = await worker.recognize(canvas.toBuffer());

    console.log('\n--- RAW TEXT ---');
    console.log(result.data.text);

    console.log('\n--- PARSED LIST ---');
    if (result.data.words) {
        for (const word of result.data.words) {
            let text = word.text.replace(/[^0-9.,\-]/g, '').replace(/,/g, '');
            const value = parseFloat(text);
            if (!isNaN(value)) {
                const bbox = word.bbox;
                const y = Math.round((bbox.y0 + bbox.y1) / 2);
                console.log(`Price: ${value}, Y: ${y}, Raw text: ${word.text}`);
            }
        }
    }

    await worker.terminate();
}

testOCR().catch(console.error);
