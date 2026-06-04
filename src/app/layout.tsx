import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Viladomat Demo App",
  description: "Next.js + MySQL desplegado en Docker Swarm con Portainer y Traefik"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
