import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'sonner';
import { ApiLoadingIndicator } from '@/components/ui/Loader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@200..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-nunito dark:bg-gray-900">
        <ThemeProvider>
          <SidebarProvider>
            <Toaster position="top-right" richColors />
            <ApiLoadingIndicator />
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
