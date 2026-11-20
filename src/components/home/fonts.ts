import { Anuphan, Bagel_Fat_One } from "next/font/google";

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-anuphan",
});

const fat = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-fat",
});

/** Root class for pages styled by home.css: scope plus the two font variables. */
export const tfhClass = `tfh ${anuphan.variable} ${fat.variable}`;
