/**
 * VideoKit Pure Browser-Native Image & PDF Processing Engine
 * Zero server uploads | 100% Client-side | High-resolution Canvas & Web APIs
 */

/**
 * Load image file and extract dimension and metadata
 */
export function loadImageMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        file,
        url,
        imageElement: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type || 'image/png',
        lastModified: file.lastModified
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file.'));
    };
    img.src = url;
  });
}

/**
 * Convert image between PNG, JPG/JPEG, WebP, and BMP with quality and background color handling
 */
export async function convertImageFormat({
  imageSource, // Image element or dataUrl/blobUrl
  targetFormat = 'jpeg', // 'jpeg' | 'png' | 'webp'
  quality = 0.92, // 0.1 to 1.0
  backgroundColor = '#ffffff', // For PNG to JPG transparency replacement
  maxWidth = null,
  maxHeight = null,
  filters = {}
}) {
  return new Promise((resolve, reject) => {
    const img = imageSource instanceof HTMLImageElement ? imageSource : new Image();

    const process = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Handle downscaling if requested
      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // For JPEG format, transparency is not supported, so fill with background color
      const mimeType = targetFormat === 'png' ? 'image/png' : targetFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      // Apply CSS Filters if provided
      const filterParts = [];
      if (filters.brightness !== undefined && filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
      if (filters.contrast !== undefined && filters.contrast !== 100) filterParts.push(`contrast(${filters.contrast}%)`);
      if (filters.saturate !== undefined && filters.saturate !== 100) filterParts.push(`saturate(${filters.saturate}%)`);
      if (filters.hue !== undefined && filters.hue !== 0) filterParts.push(`hue-rotate(${filters.hue}deg)`);
      if (filters.invert !== undefined && filters.invert !== 0) filterParts.push(`invert(${filters.invert}%)`);
      if (filters.sepia !== undefined && filters.sepia !== 0) filterParts.push(`sepia(${filters.sepia}%)`);
      if (filters.grayscale !== undefined && filters.grayscale !== 0) filterParts.push(`grayscale(${filters.grayscale}%)`);
      if (filters.blur !== undefined && filters.blur !== 0) filterParts.push(`blur(${filters.blur}px)`);

      if (filterParts.length > 0) {
        ctx.filter = filterParts.join(' ');
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas conversion failed.'));
          return;
        }
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          size: blob.size,
          width,
          height,
          mimeType,
          extension: targetFormat === 'jpeg' ? 'jpg' : targetFormat
        });
      }, mimeType, quality);
    };

    if (imageSource instanceof HTMLImageElement && img.complete) {
      process();
    } else {
      img.onload = process;
      img.onerror = () => reject(new Error('Failed to load image source.'));
      if (typeof imageSource === 'string') {
        img.src = imageSource;
      }
    }
  });
}

/**
 * Helper to dynamically load external script if not present
 */
function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Render PDF Pages to high-resolution Images in browser
 * Uses pdfjs-dist via local bundle or CDN fallback
 */
export async function renderPdfToImages(pdfFile, {
  scale = 2.0, // 2.0 = 200% DPI for crisp text
  format = 'png',
  quality = 0.95,
  onProgress = () => {}
}) {
  onProgress(10);
  const arrayBuffer = await pdfFile.arrayBuffer();

  // Try importing or falling back to CDN
  let pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
  if (!pdfjsLib) {
    try {
      const mod = await import('pdfjs-dist');
      pdfjsLib = mod.default || mod;
    } catch (e) {
      await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      pdfjsLib = window.pdfjsLib;
    }
  }

  if (!pdfjsLib) {
    throw new Error('PDF.js library could not be loaded in browser.');
  }

  // Set worker source
  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  onProgress(25);
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pages = [];
  const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Fill white background for pages
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const blob = await new Promise(r => canvas.toBlob(r, mimeType, quality));

    pages.push({
      pageNumber: pageNum,
      dataUrl,
      blob,
      size: blob.size,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      fileName: `${pdfFile.name.replace(/\.[^/.]+$/, '')}_page_${pageNum}.${format === 'jpeg' ? 'jpg' : format}`
    });

    const progressPct = Math.round(25 + ((pageNum / numPages) * 70));
    onProgress(progressPct);
  }

  onProgress(100);
  return {
    numPages,
    pages,
    pdfFileName: pdfFile.name
  };
}

/**
 * Convert multiple Images into a single multi-page PDF in browser
 * Uses jspdf with CDN fallback
 */
export async function convertImagesToPdf(imageFiles, {
  pageSize = 'a4',
  orientation = 'portrait', // 'portrait' | 'landscape'
  margin = 10,
  onProgress = () => {}
}) {
  onProgress(15);

  let jsPDF = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPDF) {
    try {
      const mod = await import('jspdf');
      jsPDF = mod.jsPDF || mod.default?.jsPDF || mod.default;
    } catch (e) {
      await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      jsPDF = window.jspdf.jsPDF;
    }
  }

  if (!jsPDF) {
    throw new Error('jsPDF library could not be loaded in browser.');
  }

  onProgress(30);
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - (margin * 2);
  const usableHeight = pageHeight - (margin * 2);

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    if (i > 0) {
      doc.addPage(pageSize, orientation);
    }

    const imgData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imgData;
    });

    // Calculate aspect-preserving dimensions
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let targetWidth = usableWidth;
    let targetHeight = targetWidth / imgAspect;

    if (targetHeight > usableHeight) {
      targetHeight = usableHeight;
      targetWidth = targetHeight * imgAspect;
    }

    const posX = margin + (usableWidth - targetWidth) / 2;
    const posY = margin + (usableHeight - targetHeight) / 2;

    const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
    doc.addImage(imgData, format, posX, posY, targetWidth, targetHeight, undefined, 'FAST');

    onProgress(Math.round(30 + (((i + 1) / imageFiles.length) * 65)));
  }

  const pdfBlob = doc.output('blob');
  onProgress(100);

  return {
    blob: pdfBlob,
    url: URL.createObjectURL(pdfBlob),
    size: pdfBlob.size,
    pagesCount: imageFiles.length
  };
}

/**
 * Remove solid background color (e.g. White or Green Screen) from an image
 */
export async function removeColorBackground(imageElement, {
  targetHex = '#ffffff',
  tolerance = 35 // 0 to 100
}) {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth || imageElement.width;
  canvas.height = imageElement.naturalHeight || imageElement.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Parse target hex color
  const rT = parseInt(targetHex.slice(1, 3), 16) || 255;
  const gT = parseInt(targetHex.slice(3, 5), 16) || 255;
  const bT = parseInt(targetHex.slice(5, 7), 16) || 255;

  const threshold = (tolerance / 100) * 441.67; // max distance sqrt(255^2*3)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - rT, 2) + Math.pow(g - gT, 2) + Math.pow(b - bT, 2)
    );

    if (dist <= threshold) {
      data[i + 3] = 0; // Transparent
    } else if (dist <= threshold + 20) {
      // Soft edge antialiasing
      data[i + 3] = Math.round(((dist - threshold) / 20) * 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        blob,
        url: URL.createObjectURL(blob),
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        mimeType: 'image/png'
      });
    }, 'image/png');
  });
}

/**
 * Generate a colorful, high-res sample photo in browser memory for instant demo testing
 */
export function generateSampleImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Rich gradient landscape
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0284c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glowing sun orb
  const sunGrad = ctx.createRadialGradient(canvas.width / 2, 280, 20, canvas.width / 2, 280, 200);
  sunGrad.addColorStop(0, '#38bdf8');
  sunGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.4)');
  sunGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 280, 200, 0, Math.PI * 2);
  ctx.fill();

  // Mountain silhouettes
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(250, 480);
  ctx.lineTo(500, 620);
  ctx.lineTo(750, 420);
  ctx.lineTo(1000, 580);
  ctx.lineTo(canvas.width, 500);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Outfit, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VideoKit Image Studio', canvas.width / 2, 160);

  ctx.font = '22px Inter, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('100% In-Browser Image & PDF Processing Demo', canvas.width / 2, 210);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'videokit_sample_photo.png', { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}
