import type { SolarcellPackage, SolarStats, SolarBenefit, InstallationStep, KnowledgeArticle, SolarProductInfo } from "@/src/types/solar";
import type { BannerData } from "@/src/types/content";

// ===== Solar Banner =====
export const solarBanner: BannerData[] = [
  { id: 1, image: "/assets/solar/wwenergy_bg1-scaled-e1729143100746.webp" },
];

// ===== Solar Stats =====
export const solarStats: SolarStats[] = [
  { province: "77", team: "57", project: "2115", solarcell: "56,304" },
];

// ===== Solarcell Packages =====
export const solarcellPackages: SolarcellPackage[] = [
  {
    id: "1", title: "3 kWp", description: "ประหยัดค่าไฟ 2,000 บาท/เดือน",
    pack: "S Pack", price: "115,000", discount_price: "129,000",
    solarcell: "โซล่าเซลล์ 6 แผ่น", arae: "พื้นที่ 15 ตร.ม",
    scope: "แอร์ 2 / ทีวี 1 / ตู้เย็น 1", karantee: "คืนทุนใน 5 ปี",
  },
  {
    id: "2", title: "5 kWp", description: "ประหยัดค่าไฟ 3,000 บาท/เดือน",
    pack: "M Pack", price: "159,000", discount_price: "189,000",
    solarcell: "โซล่าเซลล์ 9 แผ่น", arae: "พื้นที่ 22 ตร.ม.",
    scope: "แอร์ 3 / ทีวี 2 / ตู้เย็น 2", karantee: "คืนทุนใน 5 ปี",
  },
  {
    id: "3", title: "10 kWp", description: "ประหยัดค่าไฟ 6,000 บาท/เดือน",
    pack: "L Pack", price: "269,000", discount_price: "299,000",
    solarcell: "โซล่าเซลล์ 18 แผ่น", arae: "พื้นที่ 44 ตร.ม",
    scope: "แอร์ 6 / ทีวี 4 / ตู้เย็น 2", karantee: "คืนทุนใน 4 ปี",
  },
];

// ===== Solar Benefits =====
export const solarBenefits: SolarBenefit[] = [
  { text: "ฟรี! เน็ตบ้านทรูออนไลน์ (มูลค่า 47,000 บาท)" },
  { text: "ฟรี! ค่าประกันและค่าติดตั้ง (มูลค่า 2,600 บาท)" },
  { text: "ฟรี! ค่าแรกเข้า (มูลค่า 2,000 บาท)" },
];

// ===== Installation Steps =====
export const installationSteps: InstallationStep[] = [
  { iconSrc: "/assets/wEnergy/icon/caht.webp", iconAlt: "Chat Icon", title: "ปรึกษา", description: "ทีมขายผู้เชี่ยวชาญพร้อมบริการคำแนะนำส่วนตัว" },
  { iconSrc: "/assets/wEnergy/icon/pic.webp", iconAlt: "Survey Icon", title: "สำรวจ", description: "ตรวจสอบเก็บข้อมูลสถานที่ พร้อมรูปถ่ายทางอากาศ" },
  { iconSrc: "/assets/wEnergy/icon/design.webp", iconAlt: "Design Icon", title: "ออกแบบ", description: "คำนวณออกแบบโครงสร้างโดยวิศวกรไฟฟ้า และ โยธา" },
  { iconSrc: "/assets/wEnergy/icon/home.webp", iconAlt: "Install Icon", title: "ติดตั้ง", description: "ควบคุมงานติดตั้งโซล่าเซลล์ ด้วยทีมงานที่มีประสบการณ์" },
  { iconSrc: "/assets/wEnergy/icon/document.webp", iconAlt: "Permit Icon", title: "ขออนุญาต", description: "ประสานงานเป็นตัวแทนยื่นขออนุญาตกับการไฟฟ้า" },
  { iconSrc: "/assets/wEnergy/icon/service.webp", iconAlt: "Service Icon", title: "บริการหลังการขาย", description: "ทีมงาน Call Center และทีมวิศวกร ที่พร้อมให้บริการทั่วประเทศ" },
];

// ===== Knowledge Articles =====
export const knowledgeArticles: KnowledgeArticle[] = [
  {
    title: "โซล่าเซลล์คืออะไร",
    content: "ระบบโซล่าเซลล์ (Solar Cell System) เป็นการแปลงแสงอาทิตย์เป็นพลังงานไฟฟ้า ซึ่งประกอบด้วย แผงโซล่าเซลล์ (Solar Cell Panel), อินเวอร์เตอร์ (Inverter) และสายไฟเชื่อมต่อกันเป็นระบบพลังงานไฟฟ้าโซล่าเซลล์ ซึ่งตัวแผงโซล่าเซลล์จะรับพลังงานแสงอาทิตย์ในรูปแบบความเข้มแสง เพื่อสร้างไฟฟ้ากระแสตรง (DC) โดยมีอินเวอร์เตอร์(Inverter) เป็นอุปกรณ์ที่แปลงไฟฟ้ากระแสตรง(DC) เป็นไฟฟ้ากระแสสลับ (AC) จ่ายไฟฟ้าให้กับบ้านของคุณ ร่วมกับไฟฟ้าที่มาจากมิเตอร์ของการไฟฟ้า ซึ่งเราจะเรียกระบบโซล่าเซลล์ (Solar Cell System) นี้ว่าแบบออนกริด (On grid) ซึ่งเป็นระบบโซล่าเซลล์ที่นิยมอย่างมากสำหรับบ้านเรือน และ โรงงาน เพราะสามารถสลับใช้ไฟฟ้าในช่วงกลางวันจากระบบโซล่าเซลล์ และเปลี่ยนไปใช้ไฟฟ้าจากมิเตอร์การไฟฟ้าในช่วงกลางคืน",
    imageSrc: "/assets/wEnergy/knowledge/install1.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "right",
  },
  {
    title: "ติดตั้งโซล่าเซลล์อย่างไร",
    content: "การติดตั้งระบบโซล่าเซลล์บนหลังคาบ้าน (Solar Rooftop) จำเป็นต้องมีการวางแผนและการเตรียมการ ในการเริ่มต้นอย่างรอบครอบ ควรประเมินสภาพหลังคา ทั้งความแข็งแรงและขนาด ทิศของหลังคา เพื่อให้การติดตั้งแผงโซล่าเซลล์ (Solar Cell Panel) นั้นสามารถผลิตกระแสไฟได้มากที่สุด การเลือกอุปกรณ์ในการติดตั้งก็เป็นสิ่งจำเป็นว่าไม่ว่าจะเป็นตัวแผงโซล่าเซลล์ อินเวอร์เตอร์ และสุดท้ายการหาบริษัทที่เป็นมืออาชีพและน่าเชื่อถืออย่างบริษัท WERWIND Energy ในการติดตั้งโซล่าเซลล์ (Solar Cell) จึงเป็นสิ่งสำคัญที่สุด",
    imageSrc: "/assets/wEnergy/knowledge/install2.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "left",
  },
  {
    title: "การสำรวจพื้นที่ติดตั้งโซล่าเซลล์",
    content: "ทีมวิศวกร WERWIND Energy ที่ผ่านการรับรองจะใช้เวลาในการสำรวจพื้นที่เพื่อเตรียมการติดตั้งประมาณ 1-3 ชั่วโมง โดยจะเริ่มจากการบินโดรนถ่ายภาพทางอากาศ เพื่อสำรวจชนิดของหลังคา อุปสรรคต่างๆที่ส่งผลต่อการขึ้นบนหลังคาเพื่อติดตั้ง รวมถึงทิศหลังคาที่จะติดตั้งแผ่นโซล่าเซลล์ (Solar Cell Panel) พร้อมกับการประเมินโครงสร้างรากฐานของหลังคาในการรับน้ำหนักของแผ่นโซล่าเซลล์ (Solar Cell Panel) จากนั้นจะสำรวจจุดที่จะติดตั้ง Inverter และตู้ AC/DC สำหรับการแปลงไฟฟ้า เพื่อเชื่อมต่อเข้ากับระบบไฟฟ้าของตัวบ้าน สุดท้ายสำรวจแนวเดินสายไฟต่างๆ เพื่อชี้แจงและสอบถามลูกค้าก่อนการติดตั้งจริง ว่าจุดไหนที่ลูกค้าต้องการให้ติดตั้งและมีความสวยงามตามที่ลูกค้าต้องการ และเกิดประสิทธิภาพการทำงานของระบบโซล่าเซลล์ได้สูงที่สุด จึงเป็นอันเสร็จสิ้นขั้นตอนการสำรวจพื้นที่ติดตั้งโซล่าเซลล์ (Solar Cell)",
    imageSrc: "/assets/wEnergy/knowledge/install3.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "right",
  },
  {
    title: "การเขียนแบบโซล่าเซลล์",
    content: "หลังจากสำรวจเสร็จสิ้น ทีมสำรวจจะส่งข้อมูลที่ได้รับให้กับทางทีมวิศวกรระบบโซล่าเซลล์ของ WERWIND Energy เพื่อทำการออกแบบด้วยโปรแกรมที่ได้รับการรับรองมาตรฐานระดับโลก โดยจะคำนวณน้ำหนักและความแข็งแรงของหลังคา ทิศทางการติดตั้งที่ดีที่สุดเพื่อให้สามารถผลิตกระแสไฟฟ้าได้มากที่สุด",
    imageSrc: "/assets/wEnergy/knowledge/install4.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "left",
  },
  {
    title: "การติดตั้งแผงโซล่าเซลล์บนหลังคา",
    content: "โดยขั้นตอนในการติดตั้งโซล่าเซลล์บนหลังคา (Solar Rooftop) จะเริ่มจากการเตรียมนั่งร้านหรือบันไดเพื่อขึ้นบนหลังคา โดยทีมปฏิบัติงานติดตั้งของ WERWIND Energyต้องผ่านการอบรมการทำงานบนที่สูงทุกคน (Working at height) และต้องใส่อุปกรณ์ป้องกัน เช่น เข็มขัดนิรภัยชนิดเต็มตัว ก่อนขึ้นทำการติดตั้งอุปกรณ์ยึดจับแผงบนหลังคา",
    imageSrc: "/assets/wEnergy/knowledge/install5.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "right",
  },
  {
    title: "การติดตั้งระบบอินเวอร์เตอร์",
    content: "ระบบอินเวอร์เตอร์ (Inverter) คือ ระบบการแปลงไฟฟ้าจากกระแสตรง (DC) ที่ถูกผลิตจากแผ่นโซล่าเซลล์บนหลังคา เปลี่ยนเป็นกระแสนไฟฟ้าแบบสลับ (AC) ซึ่งเป็นกระแสไฟฟ้ารูปแบบที่ใช้กันในบ้านเราขนาด 220V",
    imageSrc: "/assets/wEnergy/knowledge/install6.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "left",
  },
  {
    title: "การตรวจสอบระบบโซล่าเซลล์",
    content: "มาถึงขั้นตอนสุดท้ายก่อนการเริ่มใช้งานระบบไฟฟ้าโซล่าเซลล์ (Solar Cell) เราเรียกกระบวนการนี้ว่า Commissioning Process คือการทดสอบระบบก่อนการใช้งาน",
    imageSrc: "/assets/wEnergy/knowledge/install7.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "right",
  },
  {
    title: "การบำรุงรักษาระบบโซล่าเซลล์",
    content: "การบำรุงรักษาระบบโซล่าเซลล์บนหลังคา (Solar Rooftop) นั้นค่อนข้างง่าย และราคาไม่แพงอย่างที่คนส่วนใหญ่คิด โดยคุณควรทำความสะอาดแผงโซล่าเซลล์เป็นประจำ ขั้นต่ำปีละ 1 ครั้ง",
    imageSrc: "/assets/wEnergy/knowledge/install8.webp",
    imageAlt: "Solar Installation Process",
    imagePosition: "left",
  },
];

// ===== Solar Product Info =====
export const solarProductInfo: SolarProductInfo = {
  title: "สินค้าและบริการ",
  subtitle: "Solar Rooftop System",
  description: "บริการติดตั้งระบบโซล่าเซลล์ (Solar Cell) สำหรับบ้านพักอาศัย และกลุ่มธุรกิจโรงงานอุตสาหกรรม ด้วยสินค้าจากผู้ผลิตชั้นนำของโลก เช่น ระบบแผง Mono Crystalline Tier1 รับประกันประสิทธิภาพยาวนานกว่า 30 ปี และบริหารควบคุมด้วยระบบ Inverter จาก Huawei ที่มียอดขายในตลาดเป็นอันดับ 1 ของโลก",
  contactPhone: "091-710-1605",
  imageSrc: "/assets/solar/wwenergy_product-scaled.webp",
  imageAlt: "Solar Rooftop System",
};

// ===== Solar Notes =====
export const solarNotes: string[] = [
  "คำนวณราคาค่าไฟฟ้า 4.7 บาท / หน่วย และใช้งานช่วงกลางวันเฉลี่ย 5 ชั่วโมง ต่อวัน",
  "เครื่องใช้ไฟฟ้าคำนวณจาก แอร์ 9000 BTU / ทีวี 55 นิ้ว / ตู้เย็น 12 คิว",
  "ราคาสินค้ารวมค่าบริการติดตั้ง และค่าขออนุญาตจากการไฟฟ้า (ไม่รวม Vat 7%), ราคาอาจมีการเปลี่ยนแปลง ขึ้นอยู่กับพื้นที่ในการติดตั้งและสภาพหน้างาน",
  "ฟรี !! รับประกันการบำรุงรักษาระบบโซล่าเซลล์ และล้างทำความสะอาดแผงโซล่าเซลล์นาน 2ปี",
];
