import type { Metadata } from 'next';

// Unlisted: keep it out of search engines and out of every link in the UI.
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
