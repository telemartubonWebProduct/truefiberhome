import { NextResponse } from "next/server";

const adminContact = process.env.ADS_CONTACT_EMAIL || "admin@truefiberhome.com";

const body = `# This site does not currently publish third-party ad inventory via programmatic exchanges.
# Contact: ${adminContact}
`;

export async function GET() {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
