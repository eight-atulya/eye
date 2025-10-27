import "@/styles/globals.css";
import type { ReactNode } from "react";
import { ClientBody } from "@/components/ClientBody";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <ClientBody className="bg-white text-gray-900">
        {children}
      </ClientBody>
    </html>
  );
}


