import "./globals.css";
import ClientLayout from "../components/ClientLayout";

export const metadata = {
  title: 'Vesty Dashboard',
  description: 'Frontend dashboard for Vesty',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white font-inter overflow-x-hidden">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
