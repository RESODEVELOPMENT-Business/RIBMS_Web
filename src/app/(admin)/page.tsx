'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

export default function AdminHomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Debug: log state
    console.log("AdminPage - user:", user, "isAuthenticated:", isAuthenticated, "isHydrated:", isHydrated);

    // Wait for store to hydrate before redirecting
    if (!isHydrated) {
      console.log("Waiting for store to hydrate...");
      return;
    }

    // If already redirecting, don't do anything
    if (isRedirecting) return;

    // Not authenticated - redirect to signin
    if (!isAuthenticated || !user) {
        console.log("Not authenticated, redirecting to signin");
        setIsRedirecting(true);
        router.replace('/signin');
        return;
    }

    // Authenticated - redirect based on role
    const role = user.role;
    console.log("Current role:", role);
    
    setIsRedirecting(true);
    let redirectPath = '/signin';
    
    switch (role) {
      case 'Administrator':
        console.log("Redirecting to /brands");
        redirectPath = '/brands';
        break;
      case 'BrandManager':
        console.log("Redirecting to /stores");
        redirectPath = '/stores';
        break;
      case 'StoreManager':
        console.log("Redirecting to /pos");
        redirectPath = '/pos';
        break;
      default:
        console.log("Unknown role, redirecting to signin");
        redirectPath = '/signin';
    }
    
    router.replace(redirectPath);
    
    // Safety timeout: if redirect didn't work after 5 seconds, show error
    const timeout = setTimeout(() => {
      console.error(`Navigation to ${redirectPath} may have failed`);
      toast.error(`Failed to navigate to ${redirectPath}. Please refresh the page.`);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [user, isAuthenticated, isHydrated, router, isRedirecting]);

  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          Redirecting to your workspace...
        </p>
      </div>
    </div>
  );
}
