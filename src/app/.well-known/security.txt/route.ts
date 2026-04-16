import { NextResponse } from "next/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com";
const securityContact = process.env.SECURITY_CONTACT_EMAIL || "security@truefiberhome.com";

const body = `Contact: mailto:${securityContact}
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: th, en
Canonical: ${siteUrl}/.well-known/security.txt
Policy: ${siteUrl}/anti-phishing
`;

export async function GET() {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
