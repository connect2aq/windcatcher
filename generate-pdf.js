const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Page order based on site navigation
const PAGE_ORDER = [
  'index.html',
  'overview.html',
  'section-01.html',
  'section-03.html',
  'section-04.html',
  'section-05.html',
  'section-06.html',
  'section-07.html',
  'appendix.html',
  'citations.html',
];

const SITE_DIR = path.resolve(__dirname, 'site');
const OUTPUT_PDF = path.resolve(__dirname, 'WindCatcher.pdf');

// Extract the inner content of <main> and page title
function extractPage(html, filename) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const mainContent = mainMatch ? mainMatch[1] : `<p>${filename}</p>`;

  return { title, mainContent };
}

// Fix relative image paths to absolute file:// paths
function fixImagePaths(html, siteDir) {
  return html.replace(/src="([^"]+)"/g, (match, src) => {
    if (src.startsWith('http') || src.startsWith('data:') || path.isAbsolute(src)) {
      return match;
    }
    const absPath = path.join(siteDir, src).replace(/\\/g, '/');
    return `src="file:///${absPath}"`;
  });
}

async function buildCombinedHTML() {
  const cssPath = path.join(SITE_DIR, 'assets', 'css', 'main.css').replace(/\\/g, '/');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const sections = [];

  for (const filename of PAGE_ORDER) {
    const filePath = path.join(SITE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Skipping missing file: ${filename}`);
      continue;
    }
    let html = fs.readFileSync(filePath, 'utf8');
    html = fixImagePaths(html, SITE_DIR);
    const { title, mainContent } = extractPage(html, filename);
    console.log(`  Loaded: ${filename} — "${title}"`);
    sections.push({ title, mainContent, filename });
  }

  // Build sections HTML
  const sectionsHtml = sections
    .map((s, i) => {
      const pageBreak = i === 0 ? '' : 'page-break-before: always;';
      return `
      <div class="pdf-section" style="${pageBreak}">
        ${s.mainContent}
      </div>`;
    })
    .join('\n');

  const combinedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WindCatcher — Technical Documentation</title>
  <style>
    ${cssContent}

    /* PDF-specific overrides */
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      line-height: 1.7;
      color: #1a1a1a;
      background: #ffffff;
    }

    .content-container {
      max-width: 100%;
      margin: 0;
      padding: 0;
    }

    .cover {
      text-align: center;
      margin-top: 3rem;
    }

    .cover h1 {
      font-size: 2.8rem;
    }

    .cover p {
      max-width: 100%;
      margin: 1.5rem auto;
    }

    .pdf-section {
      padding: 0;
      margin: 0;
    }

    /* Hide navigation elements */
    .page-navigation,
    .site-header,
    .site-footer,
    #header-placeholder,
    .primary-link,
    nav {
      display: none !important;
    }

    /* Make images fit page */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1rem auto;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    th, td {
      padding: 0.4rem 0.5rem;
      border-bottom: 1px solid #ddd;
    }

    /* Avoid breaking inside headings and paragraphs */
    h1, h2, h3, h4 {
      page-break-after: avoid;
    }

    p, li, table {
      page-break-inside: avoid;
    }

    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>`;

  return combinedHTML;
}

async function generatePDF() {
  console.log('Building combined HTML...');
  const html = await buildCombinedHTML();

  // Write the combined HTML temporarily for debugging (optional)
  const tempHtmlPath = path.resolve(__dirname, '_combined_temp.html');
  fs.writeFileSync(tempHtmlPath, html, 'utf8');
  console.log(`  Combined HTML saved: ${tempHtmlPath}`);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Use file:// URL so relative paths resolve correctly
  const tempFileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
  await page.goto(tempFileUrl, { waitUntil: 'networkidle0' });

  // Wait a moment for any rendering
  await new Promise(r => setTimeout(r, 1000));

  console.log('Generating PDF...');
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '18mm',
      right: '18mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:9px; color:#999; width:100%; text-align:center; font-family: sans-serif;">WindCatcher — Technical Documentation</div>`,
    footerTemplate: `<div style="font-size:9px; color:#999; width:100%; text-align:right; padding-right:18mm; font-family: sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });

  await browser.close();

  // Clean up temp file
  fs.unlinkSync(tempHtmlPath);

  const stats = fs.statSync(OUTPUT_PDF);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\nDone! PDF saved to: ${OUTPUT_PDF}`);
  console.log(`File size: ${sizeMB} MB`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
