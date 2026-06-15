import { Monoton, Alfa_Slab_One } from "next/font/google";
import "./globals.css";

const monoton = Monoton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fraunces",
  display: "swap",
});

const alfaSlabOne = Alfa_Slab_One({
  subsets: ["latin"],
  weight: ["400"],
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
      <body className={`${monoton.variable} ${alfaSlabOne.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
