import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
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
      <body className={`${fraunces.variable} ${plusJakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
