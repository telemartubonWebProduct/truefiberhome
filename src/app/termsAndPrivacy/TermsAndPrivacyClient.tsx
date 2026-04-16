const LEGAL_RISK_ITEMS = [
  "ห้ามแอบอ้างเป็นบริษัท/พนักงานเพื่อหลอกลวงผู้ใช้รายอื่น",
  "ห้ามเผยแพร่ข้อมูลเท็จ ข่าวปลอม หรือคำโฆษณาที่ทำให้ผู้บริโภคเข้าใจผิด",
  "ห้ามอัปโหลดเนื้อหาที่ละเมิดลิขสิทธิ์ เครื่องหมายการค้า หรือสิทธิของบุคคลอื่น",
  "ห้ามเข้าถึงระบบโดยไม่ได้รับอนุญาต สแกนช่องโหว่ หรือโจมตีระบบ",
  "ห้ามเก็บข้อมูลส่วนบุคคลของผู้อื่นจากเว็บไซต์ไปใช้โดยไม่มีฐานกฎหมาย",
  "ห้ามใช้บอท/สคริปต์เพื่อดึงข้อมูลจำนวนมากที่กระทบความปลอดภัยหรือเสถียรภาพระบบ",
  "ห้ามส่งสแปม หลอกให้คลิกลิงก์อันตราย หรือกระทำการที่เข้าข่ายฉ้อโกงออนไลน์",
];

const DATA_TYPES = [
  "ข้อมูลระบุตัวตน: ชื่อ นามสกุล เบอร์โทร อีเมล",
  "ข้อมูลการให้บริการ: ความสนใจแพ็กเกจ พื้นที่ติดตั้ง ช่องทางที่ใช้ติดต่อ",
  "ข้อมูลเทคนิค: IP, ประเภทเบราว์เซอร์, คุกกี้, บันทึกการใช้งานระบบ",
  "ข้อมูลติดต่อจากแชท/ฟอร์ม: เนื้อหาข้อความ วันเวลา และข้อมูลที่ท่านกรอก",
];

const DATA_SUBJECT_RIGHTS = [
  "สิทธิขอเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคล",
  "สิทธิขอแก้ไขข้อมูลให้ถูกต้องและเป็นปัจจุบัน",
  "สิทธิขอให้ลบ/ทำลาย/ทำให้ไม่สามารถระบุตัวตนได้ (ภายใต้เงื่อนไขกฎหมาย)",
  "สิทธิขอจำกัดหรือคัดค้านการประมวลผลบางกรณี",
  "สิทธิขอถอนความยินยอมในกรณีที่อาศัยฐานความยินยอม",
  "สิทธิร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)",
];

const SECURITY_MEASURES = [
  "จำกัดสิทธิ์การเข้าถึงข้อมูลตามบทบาทงาน (Need-to-know)",
  "เข้ารหัสการสื่อสารและใช้โครงสร้างพื้นฐานที่มีมาตรการความปลอดภัย",
  "บันทึกเหตุการณ์ (Audit Log) เพื่อสอบทานเหตุผิดปกติ",
  "ทบทวนผู้ประมวลผลข้อมูลภายนอก (Data Processor) และสัญญา DPA",
  "มีขั้นตอนรับมือเหตุข้อมูลรั่วไหลและประเมินการแจ้งหน่วยงาน/เจ้าของข้อมูลตาม PDPA",
];

export default function TermsAndPrivacyClient() {
  const lastUpdated = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  //test re push github

  return (
    <main className="bg-slate-50 py-24 font-prompt text-slate-800">
      <div className="mx-auto max-w-5xl px-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <header className="border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              ข้อตกลงการใช้บริการ และนโยบายความเป็นส่วนตัว
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              เอกสารนี้อธิบายเงื่อนไขการใช้งานเว็บไซต์และการคุ้มครองข้อมูลส่วนบุคคลของ
              True Fiber Home โดยยึดหลักตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
              และกฎหมายไทยที่เกี่ยวข้อง
            </p>
            <p className="mt-3 text-xs text-slate-500">ปรับปรุงล่าสุด: {lastUpdated}</p>
          </header>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">ส่วนที่ 1: ข้อตกลงการใช้บริการ (Terms of Service)</h2>
            <p className="text-sm leading-7 text-slate-700">
              เมื่อท่านเข้าถึงหรือใช้เว็บไซต์นี้ ถือว่าท่านรับทราบและยอมรับเงื่อนไขตามเอกสารนี้
              หากไม่ยอมรับเงื่อนไข โปรดยุติการใช้งานเว็บไซต์
            </p>

            <h3 className="pt-2 text-base font-semibold text-slate-900">1) ขอบเขตบริการ</h3>
            <p className="text-sm leading-7 text-slate-700">
              เว็บไซต์มีวัตถุประสงค์เพื่อให้ข้อมูลสินค้า บริการ และช่องทางติดต่อเพื่อสมัครหรือสอบถาม
              ข้อมูลบางส่วนอาจมีการเปลี่ยนแปลงตามผู้ให้บริการหลัก โปรโมชั่น หรือข้อกำหนดทางธุรกิจ
              บริษัทขอสงวนสิทธิ์ในการปรับปรุงเนื้อหาโดยไม่ต้องแจ้งล่วงหน้า
            </p>

            <h3 className="pt-2 text-base font-semibold text-slate-900">2) หน้าที่ผู้ใช้งาน</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>ให้ข้อมูลที่ถูกต้อง เป็นปัจจุบัน และไม่ทำให้ผู้อื่นเสียหาย</li>
              <li>ไม่ใช้เว็บไซต์ในทางผิดกฎหมายหรือฝ่าฝืนสิทธิบุคคลอื่น</li>
              <li>ไม่พยายามรบกวนระบบ เจาะระบบ หรือใช้งานเกินขอบเขตที่อนุญาต</li>
            </ul>

            <h3 className="pt-2 text-base font-semibold text-slate-900">3) ทรัพย์สินทางปัญญา</h3>
            <p className="text-sm leading-7 text-slate-700">
              เนื้อหา เครื่องหมายการค้า รูปภาพ และองค์ประกอบต่าง ๆ บนเว็บไซต์ เป็นทรัพย์สินของบริษัท
              หรือเจ้าของสิทธิ์ที่เกี่ยวข้อง ห้ามคัดลอก ดัดแปลง หรือเผยแพร่โดยไม่ได้รับอนุญาต
            </p>

            <h3 className="pt-2 text-base font-semibold text-slate-900">4) การจำกัดความรับผิด</h3>
            <p className="text-sm leading-7 text-slate-700">
              บริษัทพยายามดูแลความถูกต้องของข้อมูลอย่างเหมาะสม แต่ไม่รับประกันความครบถ้วนสมบูรณ์ทุกกรณี
              ผู้ใช้งานควรตรวจสอบเงื่อนไขจริงก่อนตัดสินใจทำธุรกรรมเสมอ
            </p>
          </section>

          <section className="mt-10 space-y-4 border-t border-slate-100 pt-8">
            <h2 className="text-xl font-semibold text-slate-900">ส่วนที่ 2: นโยบายความเป็นส่วนตัว (Privacy Policy / PDPA)</h2>

            <h3 className="pt-2 text-base font-semibold text-slate-900">1) ประเภทข้อมูลที่เก็บรวบรวม</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {DATA_TYPES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="pt-2 text-base font-semibold text-slate-900">2) วัตถุประสงค์และฐานกฎหมาย</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>เพื่อให้บริการตามคำขอของท่าน (ฐานสัญญา / pre-contractual request)</li>
              <li>เพื่อติดต่อกลับ ตอบคำถาม แจ้งสถานะ และดูแลบริการหลังการขาย</li>
              <li>เพื่อพัฒนาคุณภาพเว็บไซต์และความปลอดภัยของระบบ (ฐานประโยชน์โดยชอบด้วยกฎหมาย)</li>
              <li>เพื่อส่งข่าวสาร/การตลาดเมื่อได้รับความยินยอม (ฐานความยินยอม)</li>
              <li>เพื่อปฏิบัติตามหน้าที่ตามกฎหมายที่เกี่ยวข้อง</li>
            </ul>

            <h3 className="pt-2 text-base font-semibold text-slate-900">3) การเปิดเผยข้อมูลแก่บุคคลภายนอก</h3>
            <p className="text-sm leading-7 text-slate-700">
              บริษัทอาจเปิดเผยข้อมูลเท่าที่จำเป็นให้ผู้ประมวลผลข้อมูลภายนอกที่เกี่ยวข้องกับการให้บริการ
              (เช่น ระบบโฮสติ้ง ระบบแชท ระบบวิเคราะห์) ภายใต้ข้อตกลงคุ้มครองข้อมูลส่วนบุคคล และอาจเปิดเผยเมื่อกฎหมายกำหนด
            </p>

            <h3 className="pt-2 text-base font-semibold text-slate-900">4) ระยะเวลาจัดเก็บข้อมูล</h3>
            <p className="text-sm leading-7 text-slate-700">
              บริษัทจะเก็บข้อมูลเท่าที่จำเป็นตามวัตถุประสงค์และระยะเวลาที่กฎหมายกำหนด เมื่อพ้นกำหนดจะลบ
              ทำลาย หรือทำให้ไม่สามารถระบุตัวตนได้
            </p>

            <h3 className="pt-2 text-base font-semibold text-slate-900">5) มาตรการความปลอดภัย</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {SECURITY_MEASURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="pt-2 text-base font-semibold text-slate-900">6) สิทธิของเจ้าของข้อมูลส่วนบุคคล</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {DATA_SUBJECT_RIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="pt-2 text-base font-semibold text-slate-900">7) ช่องทางติดต่อเรื่องข้อมูลส่วนบุคคล</h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              <p>อีเมล: Truetelemart@hotmail.com</p>
              <p>โทรศัพท์: 091-019-2552</p>
              <p>เวลาทำการ: จันทร์-เสาร์ 09:00 - 18:00 น.</p>
            </div>
          </section>

          <section className="mt-10 space-y-4 border-t border-slate-100 pt-8">
            <h2 className="text-xl font-semibold text-slate-900">ส่วนที่ 3: ข้อควรระวังและความเสี่ยงทางกฎหมาย</h2>
            <p className="text-sm leading-7 text-slate-700">
              เพื่อป้องกันความเสี่ยงทางกฎหมายแก่ผู้ใช้งานและบริษัท โปรดหลีกเลี่ยงพฤติกรรมต่อไปนี้:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {LEGAL_RISK_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              หากตรวจพบพฤติกรรมที่อาจผิดกฎหมาย บริษัทอาจระงับการเข้าถึงระบบชั่วคราว/ถาวร เก็บหลักฐานดิจิทัล
              และประสานงานกับหน่วยงานที่เกี่ยวข้องตามกฎหมาย
            </div>
          </section>

          <section className="mt-10 border-t border-slate-100 pt-8 text-xs leading-6 text-slate-500">
            ข้อความในหน้านี้จัดทำเพื่อการแจ้งข้อมูลเชิงนโยบายและการกำกับการใช้งานเว็บไซต์
            บริษัทอาจปรับปรุงเนื้อหาเพื่อให้สอดคล้องกับข้อกฎหมายหรือแนวปฏิบัติใหม่ โดยจะแจ้งฉบับล่าสุดผ่านหน้านี้
          </section>
        </section>
      </div>
    </main>
  );
}
