import { Nunito } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'sonner';
import { ApiLoadingIndicator } from '@/components/ui/Loader';

const primaryFont = Nunito({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${primaryFont.className} dark:bg-gray-900`}>
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
