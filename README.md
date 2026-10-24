# uLikePDF – Fast, Private Online PDF Tools (ulikepdf.com)

**uLikePDF** (`ulikepdf.com`) is a modern, client-side PDF toolkit designed for speed, privacy, and simplicity. All document processing (merging, splitting, compressing, converting, rotating, and editing) executes **100% locally** inside your web browser using WebAssembly and HTML5 Canvas engines—your confidential documents are never uploaded to any remote server or stored in a cloud database.

---

## Features Implemented

1. **Merge PDF (`/merge-pdf`)**: Combine multiple PDF files with drag-to-reorder ordering.
2. **Split PDF (`/split-pdf`)**: Split by custom page ranges (e.g., `1-3, 5, 7-10`) or burst all pages into individual PDFs bundled in a `.zip`.
3. **Compress PDF (`/compress-pdf`)**: Real client-side raster downsampling with selectable optimization levels (Light, Recommended, Extreme) and accurate byte savings calculation.
4. **PDF to JPG (`/pdf-to-jpg`)**: High-fidelity page rasterization at 100, 150, or 200 DPI. Single pages export as `.jpg`; multi-page exports package into a clean `.zip`.
5. **JPG to PDF (`/jpg-to-pdf`)**: Convert JPEG photos into standardized PDF documents with orientation and margin settings.
6. **Images to PDF (`/images-to-pdf`)**: Batch compilation of mixed JPEG, PNG, and WebP images.
7. **Rotate PDF (`/rotate-pdf`)**: Visual page thumbnail grid with single-click 90° clockwise rotations on all or selected pages.
8. **Organize PDF Pages (`/organize-pdf`)**: Full page management workbench to reorder, delete, rotate, or duplicate pages.
9. **Delete PDF Pages (`/delete-pdf-pages`)**: Interactive visual selection or range deletion of unwanted pages.
10. **Extract PDF Pages (`/extract-pdf-pages`)**: Extract specific pages or intervals into a clean standalone PDF.
11. **Reorder PDF Pages (`/reorder-pdf-pages`)**: Move pages earlier or later with interactive move controls.
12. **Add Page Numbers (`/add-page-numbers`)**: Configurable position (bottom-center, bottom-right, top-center, etc.), format ("Page X of Y" or "X"), starting index, and margins.
13. **Add Watermark (`/add-watermark`)**: Diagonal or horizontal text watermarks with custom text, opacity slider, font sizing, and color.
14. **Unlock PDF (`/unlock-pdf`)**: Authenticates authorized owner/user passwords, strips encryption flags, and exports an unencrypted document.
15. **Protect PDF (`/protect-pdf`)**: Applies client-side document restriction tags and protection banners.
16. **PDF to Text (`/pdf-to-text`)**: Extracts selectable text from all pages with live in-browser preview, instant copy button, and `.txt` download.
17. **Repair PDF (`/repair-pdf`)**: Reconstructs broken cross-reference tables, stream objects, and sanitized page structures.
18. **PDF Metadata Editor (`/pdf-metadata`)**: Inspect and edit Title, Author, Subject, Keywords, or wipe all tracking metadata for privacy.

---

## Technical Architecture

- **Frontend Framework**: React 19, TypeScript, Vite.
- **Routing**: React Router v7 with clean URLs for every individual tool.
- **Styling**: Tailwind CSS v4, dark mode support with system detection and persistence.
- **PDF Engines**:
  - `pdf-lib`: For low-level PDF manipulation, page extraction, reordering, merging, watermarks, metadata, and page numbers.
  - `pdfjs-dist`: Mozilla PDF.js for rendering PDF pages to `<canvas>`, generating thumbnails, and extracting selectable text.
  - `jszip`: In-browser `.zip` generation for multi-page batch exports.
- **Hosting Target**: Firebase Hosting with single-page app (SPA) rewrites configured in `firebase.json`.

---

## Step-by-Step Firebase Hosting Deployment Guide

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (version 18 or 20+ recommended).
2. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

### Step 1: Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd <repo-folder>
npm install
```

### Step 2: Test & Build the Application Locally
```bash
# Run development server at http://localhost:3000
npm run dev

# Run production build
npm run build
```
The production bundle will be generated into the `dist/` directory.

### Step 3: Log In to Firebase
```bash
firebase login
```

### Step 4: Link or Create Your Firebase Project
```bash
# View existing projects
firebase projects:list

# If starting fresh, initialize hosting:
firebase init hosting
```
- Select: **Use an existing project** (or create a new one in the Firebase Console).
- Public directory: **dist**
- Configure as a single-page app (rewrite all urls to /index.html): **Yes**
- Set up automatic builds and deploys with GitHub: (Optional)

Alternatively, copy `.firebaserc.example` to `.firebaserc` and insert your Project ID:
```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

### Step 5: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```
Upon completion, the CLI will output your live URL (e.g. `https://your-project.web.app`).

### Step 6: Connect Your Custom Domain (ulikepdf.com)
1. Go to the [Firebase Console](https://console.firebase.google.com/) > Select your project > **Hosting**.
2. Click **Add custom domain** and enter `ulikepdf.com` (and optionally `www.ulikepdf.com`).
3. Add the TXT and A records provided by Firebase to your DNS manager (e.g. Cloudflare, Namecheap, GoDaddy).
4. Firebase automatically provisions an SSL/TLS certificate for HTTPS at no charge.

---

## Manual Testing Checklist

- [x] **Merge PDF**: Upload 2 or more PDFs, verify page counts, click Merge, download and view combined PDF.
- [x] **Split PDF**: Upload a multi-page PDF, split into ranges (e.g. 1-2, 3), verify ZIP contains split files.
- [x] **Compress PDF**: Upload a photo-heavy PDF, select "Recommended", verify real bytes saved and downloaded file opens cleanly.
- [x] **PDF to JPG**: Upload PDF, convert, verify JPG quality and resolution.
- [x] **JPG to PDF**: Upload multiple image files, configure margins/orientation, download unified PDF.
- [x] **Rotate PDF**: View page previews, rotate single pages or click "Rotate All 90°", verify orientation in exported file.
- [x] **Organize & Delete Pages**: Delete page, reorder sequence, verify exported PDF matches order.
- [x] **Add Page Numbers**: Number pages with "Page X of Y", check bottom-center alignment in Adobe Acrobat or browser viewer.
- [x] **Add Watermark**: Apply custom "CONFIDENTIAL" text at 45° angle with 30% opacity, confirm watermark renders on all pages.
- [x] **PDF to Text**: Extract text, verify live preview text area and copy-to-clipboard functionality.
- [x] **PDF Metadata Editor**: Inspect Title/Author/Subject, update fields, save and confirm metadata in PDF inspector.
- [x] **Theme Switcher**: Click Sun/Moon icon in header, verify dark mode persistence across page reloads.
- [x] **Mobile Responsiveness**: Test at 360px, 768px, 1024px, and 1440px widths. Verify mobile hamburger menu opens and closes.
- [x] **Direct Route Visits**: Refresh `/compress-pdf` directly in browser to confirm SPA routing works without 404s.
- [x] **Search**: Type "split" in homepage hero search; verify instant filter updates and navigation.

---

## Limitations & Technical Boundary Disclosures

1. **Browser Memory**: Extremely large files (e.g. >200MB uncompressed raw scans or >1,000 pages) may exceed browser tab memory limits on mobile or low-spec devices.
2. **Proprietary DRM**: Documents protected by proprietary Adobe LiveCycle DRM or unsupported digital certificate smartcards cannot be decrypted without the native desktop Adobe Acrobat environment.
3. **Severe Corruption**: The repair tool reconstructs invalid xref tables and uncompressed stream objects, but cannot recover bytes that were permanently truncated or overwritten prior to upload.
