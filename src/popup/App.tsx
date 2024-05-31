import * as React from "react";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function App() {
  return (
    <main className="w-80 px-5 py-4">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>Hello from shadcn!</AlertDescription>
      </Alert>
    </main>
  );
}
