import "@/style/global.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "BlastMail – Email Campaign Manager",
    template: "%s | BlastMail",
  },
  description: "Blast email campaign manager untuk kirim pesan ke banyak email sekaligus.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
