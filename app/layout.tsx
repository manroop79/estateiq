import "./globals.css";
import MagneticSidebar from "@/components/layout/MagneticSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "EstateIQ", description: "Real-Estate KYC & Legal Copilot" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen flex relative">
                    <div aria-hidden="true" className="fixed inset-0 -z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-slate-950 to-zinc-900"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-800/25 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-700/60 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    </div>
                    <MagneticSidebar/>
                    <div className="flex-1 flex flex-col relative z-[1]">
                        <main className="px-4 pb-10 pt-6 lg:px-8">{children}</main>
                    </div>
                </div>
                <Toaster />
            </body>
        </html>
    );
}