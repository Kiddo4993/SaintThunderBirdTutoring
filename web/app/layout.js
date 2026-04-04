import { Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
});

export const metadata = {
  title: "Saint Thunderbird Tutoring",
  description:
    "Connecting indigenous and rural community students with expert volunteer tutors.",
  icons: { icon: "/favicon.svg", type: "image/svg+xml" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${orbitron.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
