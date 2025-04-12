import "./globals.css";
import Sidebar from "../components/Sidebar";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white font-inter overflow-x-hidden">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-12 p-6 max-w-[calc(100vw-3rem)] overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
