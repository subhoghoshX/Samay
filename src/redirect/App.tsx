import React, { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function App() {
  useEffect(() => {
    // dark mode
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", themeChangeListener);
    function themeChangeListener(event: MediaQueryListEvent) {
      const isDark = event.matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", themeChangeListener);
    };
  }, []);

  const redirectedFrom = new URL(window.location.href).searchParams.get("from");

  return (
    <main className="flex justify-center items-center min-h-screen">
      <Alert className="w-fit">
        <Info className="h-4 w-4 mt-1" />
        <AlertTitle className="text-base">
          Redirected from{" "}
          <a className="text-blue-500 hover:underline" href={redirectedFrom}>
            {redirectedFrom}
          </a>
        </AlertTitle>
        <AlertDescription>
          If you still want to visit the original page, disable focus mode in
          extension{" "}
          <a
            className="text-blue-500 hover:underline"
            href="/newtab/index.html"
          >
            dashboard
          </a>
          .
        </AlertDescription>
      </Alert>
    </main>
  );
}
