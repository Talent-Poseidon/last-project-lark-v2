import { GET, POST } from "@/auth"; // Referencing auth.ts in root

export { GET, POST };

// Paksa route ini menjadi dynamic agar tidak di-pre-render saat build
export const dynamic = "force-dynamic";
