import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

const brandSans = Montserrat({ variable: "--font-dc-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://deal-capital.vercel.app"),
  title: { default: "DealCapital | Conectamos oportunidades", template: "%s | DealCapital" },
  description: "Explora proyectos de emprendimiento, presenta oportunidades y conecta con potenciales inversionistas de forma informada.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "DealCapital — Conexiones con más confianza",
    description: "Un ecosistema para emprendedores e inversionistas. Plataforma en fase MVP.",
    type: "website",
    locale: "es_PE",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className={brandSans.variable + " " + geistMono.variable}>
    <body className="flex min-h-screen flex-col bg-[#020817] antialiased">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[100] focus:rounded-lg focus:bg-[#facc15] focus:p-3 focus:text-slate-950">Saltar al contenido</a>
      <Navbar />
      <div id="contenido" className="flex-1">{children}</div>
      <Footer />
    </body>
  </html>;
}
