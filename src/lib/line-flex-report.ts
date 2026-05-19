export type DailyReportStats = {
  thaiDate: string;
  regis: number;
  connect: number;
  wait: number;
  cannotInstall: number;
  todaySales: number;
  totalSales: number;
};

export function buildDailyReportText(stats: DailyReportStats) {
  const { thaiDate, regis, connect, wait, cannotInstall, todaySales, totalSales } = stats;
  return `📊 รายงานยอดขายออนไลน์ประจำวัน
🗓️ ${thaiDate}

📌 สถานะงาน (Regis/Connect)
🌐 ออนไลน์: (${regis}/${connect}) | ⏳ รอ: ${wait} | ❌ ติดไม่ได้: ${cannotInstall}

➖➖➖➖➖➖➖➖➖➖
🎯 ยอดขายวันนี้: ${todaySales} Sub
📈 ยอดขายรวม: ${totalSales} Sub`;
}

const BRAND_RED = '#E60012';
const BRAND_RED_DARK = '#B3000E';
const INK = '#1F2937';
const MUTED = '#6B7280';
const SUBTLE = '#F3F4F6';
const ONLINE_BG = '#E8F4FD';
const ONLINE_FG = '#0B61C7';
const WAIT_BG = '#FFF6E0';
const WAIT_FG = '#B7791F';
const FAIL_BG = '#FFE9EB';
const FAIL_FG = '#C0212A';

export function buildDailyReportFlex(stats: DailyReportStats) {
  const {
    thaiDate,
    regis,
    connect,
    wait,
    cannotInstall,
    todaySales,
    totalSales,
  } = stats;

  const altText = `รายงานยอดขายวันนี้ ${todaySales} Sub (รวม ${totalSales} Sub)`;

  return {
    type: 'flex' as const,
    altText,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        backgroundColor: BRAND_RED,
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📊',
                size: 'xl',
                flex: 0,
              },
              {
                type: 'text',
                text: 'รายงานยอดขายออนไลน์',
                color: '#FFFFFF',
                weight: 'bold',
                size: 'lg',
                margin: 'sm',
                gravity: 'center',
              },
            ],
          },
          {
            type: 'text',
            text: 'ประจำวัน',
            color: '#FFFFFFCC',
            size: 'sm',
            margin: 'xs',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '🗓️',
                size: 'sm',
                flex: 0,
              },
              {
                type: 'text',
                text: thaiDate,
                color: '#FFFFFF',
                size: 'sm',
                weight: 'bold',
                margin: 'sm',
              },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📌',
                size: 'sm',
                flex: 0,
              },
              {
                type: 'text',
                text: 'สถานะงาน (Regis / Connect)',
                weight: 'bold',
                color: INK,
                size: 'md',
                margin: 'sm',
              },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            margin: 'md',
            contents: [
              statTile('🌐', 'ออนไลน์', `${regis}/${connect}`, ONLINE_BG, ONLINE_FG),
              statTile('⏳', 'รอ', `${wait}`, WAIT_BG, WAIT_FG),
              statTile('❌', 'ติดไม่ได้', `${cannotInstall}`, FAIL_BG, FAIL_FG),
            ],
          },
          { type: 'separator', margin: 'xl', color: '#E5E7EB' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: '💰',
                size: 'sm',
                flex: 0,
              },
              {
                type: 'text',
                text: 'ยอดขาย',
                weight: 'bold',
                color: INK,
                size: 'md',
                margin: 'sm',
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            paddingAll: '14px',
            cornerRadius: '12px',
            backgroundColor: SUBTLE,
            contents: [
              {
                type: 'text',
                text: '🎯 ยอดขายวันนี้',
                color: MUTED,
                size: 'sm',
              },
              {
                type: 'box',
                layout: 'baseline',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: `${todaySales}`,
                    weight: 'bold',
                    size: '3xl',
                    color: BRAND_RED_DARK,
                    flex: 0,
                  },
                  {
                    type: 'text',
                    text: 'Sub',
                    color: BRAND_RED_DARK,
                    size: 'md',
                    margin: 'sm',
                  },
                ],
              },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '📈 ยอดรวมเดือนนี้',
                color: MUTED,
                size: 'sm',
                flex: 5,
                gravity: 'center',
                wrap: true,
              },
              {
                type: 'text',
                text: `${totalSales} Sub`,
                weight: 'bold',
                size: 'lg',
                color: INK,
                align: 'end',
                flex: 3,
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        backgroundColor: '#FAFAFA',
        contents: [
          {
            type: 'text',
            text: 'TrueFiberHome • Daily Online Sales',
            color: '#9CA3AF',
            size: 'xs',
            align: 'center',
          },
        ],
      },
      styles: {
        header: { separator: false },
        footer: { separator: false },
      },
    },
  };
}

function statTile(
  icon: string,
  label: string,
  value: string,
  bg: string,
  fg: string,
) {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    cornerRadius: '10px',
    backgroundColor: bg,
    paddingAll: '10px',
    spacing: 'xs',
    contents: [
      {
        type: 'text',
        text: icon,
        size: 'md',
        align: 'center',
      },
      {
        type: 'text',
        text: label,
        size: 'xxs',
        color: fg,
        weight: 'bold',
        align: 'center',
        wrap: true,
      },
      {
        type: 'text',
        text: value,
        weight: 'bold',
        size: 'xl',
        color: fg,
        align: 'center',
        margin: 'xs',
      },
    ],
  };
}
