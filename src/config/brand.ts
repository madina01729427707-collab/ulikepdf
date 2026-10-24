/**
 * Central Brand and Application Configuration
 * Customized for ulikepdf.com (uLikePDF)
 */

export const BRAND = {
  name: "uLikePDF",
  prefix: "uLike",
  suffix: "PDF",
  tagline: "All Your PDF Tools in One Place",
  description: "Fast, 100% private client-side PDF tools on ulikepdf.com. Merge, split, compress, convert, rotate, and edit PDF documents directly in your browser without uploading to any server.",
  domain: "ulikepdf.com",
  url: "https://ulikepdf.com",
  supportEmail: "support@ulikepdf.com",
  primaryColor: "#2563EB",
  accentColor: "#1D4ED8",
  contact: {
    addressPlaceholder: "[uLikePDF Technologies / Operating Entity Name]",
    emailPlaceholder: "support@ulikepdf.com",
    hours: "Monday – Friday: 9am – 5pm EST"
  },
  social: {
    twitter: "https://twitter.com/ulikepdf",
    github: "https://github.com/ulikepdf"
  },
  stats: {
    browserProcessed: "100% Client-Side",
    serverStorage: "Zero File Retention",
    privacyScore: "Private & Secure"
  }
} as const;
