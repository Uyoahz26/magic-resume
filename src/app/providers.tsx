import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Avoid hydration mismatch by only enabling system theme on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={mounted}
      disableTransitionOnChange
      storageKey="magic-resume-theme"
    >
      {children}
    </ThemeProvider>
  );
}
