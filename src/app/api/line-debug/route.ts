import { NextRequest, NextResponse } from 'next/server';

const stripQuotes = (v: string | undefined) =>
  (v ?? '').trim().replace(/^['"]|['"]$/g, '');

const LINE_TOKEN = stripQuotes(process.env.LINE_CHANNEL_ACCESS_TOKEN);
const GROUP_ID = stripQuotes(process.env.LINE_GROUP_ID);
const USER_ID = stripQuotes(process.env.LINE_USER_ID);
const CRON_SECRET = stripQuotes(process.env.CRON_SECRET);

const maskId = (id: string) =>
  id ? `${id.slice(0, 2)}…${id.slice(-3)} (len=${id.length})` : '(empty)';

async function lineGet(path: string) {
  const res = await fetch(`https://api.line.me${path}`, {
    headers: { Authorization: `Bearer ${LINE_TOKEN}` },
  });
  const raw = await res.text();
  let body: unknown = raw;
  try {
    body = JSON.parse(raw);
  } catch {}
  return { ok: res.ok, status: res.status, body };
}

export async function GET(req: NextRequest) {
  // ต้องใส่ ?secret=CRON_SECRET เพื่อไม่ให้ token รั่ว
  const secret = req.nextUrl.searchParams.get('secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!LINE_TOKEN) {
    return NextResponse.json(
      { ok: false, reason: 'LINE_CHANNEL_ACCESS_TOKEN is empty' },
      { status: 500 },
    );
  }

  const env = {
    LINE_CHANNEL_ACCESS_TOKEN: LINE_TOKEN
      ? `present (len=${LINE_TOKEN.length})`
      : 'missing',
    LINE_GROUP_ID: GROUP_ID ? maskId(GROUP_ID) : 'missing',
    LINE_USER_ID: USER_ID ? maskId(USER_ID) : 'missing',
  };

  const botInfo = await lineGet('/v2/bot/info');
  const quota = await lineGet('/v2/bot/message/quota');
  const consumption = await lineGet('/v2/bot/message/quota/consumption');

  // ลองยิงข้อความเปล่า ๆ ไปเช็คทีละปลายทาง (validate endpoint ไม่ส่งจริง)
  const validate = async (to: string) => {
    if (!to) return { skipped: true };
    const res = await fetch('https://api.line.me/v2/bot/message/validate/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [{ type: 'text', text: 'ping' }],
      }),
    });
    const raw = await res.text();
    let body: unknown = raw;
    try {
      body = JSON.parse(raw);
    } catch {}
    return { status: res.status, body };
  };

  // groupSummary เช็คว่า bot ยังอยู่ในกลุ่มไหม
  const groupSummary = GROUP_ID
    ? await lineGet(`/v2/bot/group/${GROUP_ID}/summary`)
    : { skipped: true };

  return NextResponse.json({
    env,
    botInfo,
    quota,
    consumption,
    groupSummary,
    messageValidate: await validate(GROUP_ID || USER_ID),
    hint: [
      'botInfo.ok=false → token เพี้ยน/หมดอายุ',
      'groupSummary.status=404 → bot ถูกเตะออกจากกลุ่ม หรือ GROUP_ID ผิด',
      'quota.body.type=limited & consumption=value ≥ limit → quota หมด',
    ],
  });
}
