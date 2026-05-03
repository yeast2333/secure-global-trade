// 共享商品数据：让首页、详情页、购物车抽屉读到同一份"产品事实"
// 安全技术点：在真实接入 Supabase 前，把数据集中在这里方便后续替换成 server fetch + zod 校验

import productImages from "./product-images.json";
export type ProductCategory =
  | "electronics"
  | "home"
  | "industrial"
  | "ppe"
  | "logistics";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  imageUrl: string;
  priceUsd: number;
  /** 折扣原价；存在且高于 priceUsd 时表示促销 */
  priceUsdOriginal?: number;
  stock: number;
  batchNo: string;
  description: string;
};

export const productCategories: ReadonlyArray<"all" | ProductCategory> = [
  "all",
  "electronics",
  "home",
  "industrial",
  "ppe",
  "logistics",
];

// 按品类配色：placehold.co 上 bg / fg 都是 6 位 hex（不带 #）
//   - electronics: 深蓝 + 青色（科技感）
//   - home:        深石 + 琥珀（家居暖光）
//   - industrial:  靛蓝 + 橙色（重工业）
//   - ppe:         深绿 + 浅薄荷（安全色）
//   - logistics:   深紫 + 淡紫（物流货运）
const CATEGORY_PALETTE: Record<ProductCategory, { bg: string; fg: string }> = {
  electronics: { bg: "0f172a", fg: "67e8f9" },
  home:        { bg: "1c1917", fg: "fbbf24" },
  industrial:  { bg: "1e1b4b", fg: "fb923c" },
  ppe:         { bg: "064e3b", fg: "a7f3d0" },
  logistics:   { bg: "3b0764", fg: "c4b5fd" },
};

// 商品主图：优先 lib/product-images.json（Unsplash，许可见 https://unsplash.com/license）
//   - 自动按商品 ID 解析；缺省时回落到 placehold.co，避免上线缺图
function brandedImage(name: string, category: ProductCategory) {
  const { bg, fg } = CATEGORY_PALETTE[category];
  const label = encodeURIComponent(name);
  return `https://placehold.co/800x600/${bg}/${fg}.png?text=${label}&font=montserrat`;
}

function resolveProductImageUrl(
  id: string,
  name: string,
  category: ProductCategory,
): string {
  const url = productImages[id as keyof typeof productImages];
  return typeof url === "string" && url.length > 0 ? url : brandedImage(name, category);
}

type ProductSeed = Omit<Product, "imageUrl">;

const PRODUCT_SEEDS: ProductSeed[] = [
  // ============== Electronics ==============
  {
    id: "P-1003",
    name: "Secure RFID Door Lock",
    category: "electronics",
    priceUsd: 89,
    priceUsdOriginal: 119,
    stock: 58,
    batchNo: "BATCH-2026-0003-66510",
    description:
      "13.56MHz RFID + PIN lock with audit log via encrypted BLE channel.",
  },
  {
    id: "P-1005",
    name: "Industrial Inspection Camera",
    category: "electronics",
    priceUsd: 159,
    priceUsdOriginal: 219,
    stock: 24,
    batchNo: "BATCH-2026-0005-44719",
    description:
      "1080p endoscope with IP67 housing and tamper-evident packaging.",
  },
  {
    id: "P-1010",
    name: "Wireless Door Sensor",
    category: "electronics",
    priceUsd: 18,
    priceUsdOriginal: 26,
    stock: 410,
    batchNo: "BATCH-2026-0010-55432",
    description:
      "Zigbee 3.0 magnetic sensor with AES-128 encryption and 2-year battery.",
  },
  {
    id: "P-1011",
    name: "4K Conference Webcam Pro",
    category: "electronics",
    priceUsd: 79,
    priceUsdOriginal: 119,
    stock: 92,
    batchNo: "BATCH-2026-0011-71034",
    description:
      "Sony sensor 4K@30fps webcam with hardware mute and 110 deg FOV.",
  },
  {
    id: "P-1012",
    name: "Bluetooth 5.3 Earbuds",
    category: "electronics",
    priceUsd: 24.99,
    priceUsdOriginal: 39.99,
    stock: 320,
    batchNo: "BATCH-2026-0012-22918",
    description:
      "ENC dual-mic, IPX5, hi-res audio. CE/FCC/RoHS certified for cross-border export.",
  },
  {
    id: "P-1013",
    name: "65W GaN Travel Charger",
    category: "electronics",
    priceUsd: 29.9,
    priceUsdOriginal: 49.9,
    stock: 180,
    batchNo: "BATCH-2026-0013-83211",
    description:
      "3-port USB-C/USB-A multi-region plug, supports PD3.0 / PPS, US-EU-UK-AU adapters.",
  },
  {
    id: "P-1014",
    name: "Smart NVR 8CH PoE",
    category: "electronics",
    priceUsd: 219,
    priceUsdOriginal: 299,
    stock: 36,
    batchNo: "BATCH-2026-0014-49021",
    description: "8-channel PoE NVR, supports 4K AI human/vehicle detection.",
  },
  {
    id: "P-1015",
    name: "Bench Power Supply 0-30V",
    category: "electronics",
    priceUsd: 119,
    stock: 48,
    batchNo: "BATCH-2026-0015-77152",
    description:
      "Linear bench supply, 0-30V / 0-10A, 4-digit display, OVP/OCP protection.",
  },
  {
    id: "P-1016",
    name: "USB-C Hub 9-in-1",
    category: "electronics",
    priceUsd: 35,
    priceUsdOriginal: 59,
    stock: 248,
    batchNo: "BATCH-2026-0016-99021",
    description:
      "HDMI 4K@60Hz + 100W PD + Gigabit ethernet + SD/TF + 3xUSB-A.",
  },
  {
    id: "P-1017",
    name: "Wireless Logistics Scanner",
    category: "electronics",
    priceUsd: 89,
    priceUsdOriginal: 129,
    stock: 110,
    batchNo: "BATCH-2026-0017-66180",
    description:
      "1D/2D BT 5.0 wireless barcode scanner, 100m range, 2400mAh battery.",
  },

  // ============== Home ==============
  {
    id: "P-1007",
    name: "Smart Door Bell 2K",
    category: "home",
    priceUsd: 119,
    priceUsdOriginal: 169,
    stock: 96,
    batchNo: "BATCH-2026-0007-22091",
    description:
      "End-to-end encrypted video doorbell, supports HomeKit Secure Video.",
  },
  {
    id: "P-1008",
    name: "Industrial Air Purifier",
    category: "home",
    priceUsd: 249,
    priceUsdOriginal: 329,
    stock: 42,
    batchNo: "BATCH-2026-0008-77103",
    description:
      "HEPA H13 + activated carbon, suitable for warehouses up to 60 sqm.",
  },
  {
    id: "P-1018",
    name: "Stainless Coffee Brewer 1.8L",
    category: "home",
    priceUsd: 64.99,
    priceUsdOriginal: 89.99,
    stock: 140,
    batchNo: "BATCH-2026-0018-50231",
    description:
      "Programmable drip brewer with thermal carafe; CE-certified for EU export.",
  },
  {
    id: "P-1019",
    name: "360 Kitchen Sink Faucet",
    category: "home",
    priceUsd: 14.99,
    priceUsdOriginal: 19.99,
    stock: 540,
    batchNo: "BATCH-2026-0019-90121",
    description:
      "Universal faucet extender, 360 deg rotation, 3 spray modes, fits 90% of taps.",
  },
  {
    id: "P-1020",
    name: "LCD Digital Kitchen Scale",
    category: "home",
    priceUsd: 7.99,
    priceUsdOriginal: 12.99,
    stock: 720,
    batchNo: "BATCH-2026-0020-22013",
    description:
      "Spoon-style scale, 0.1g precision, tare function, ideal for spices and coffee.",
  },
  {
    id: "P-1021",
    name: "Robot Vacuum 4000Pa",
    category: "home",
    priceUsd: 199,
    priceUsdOriginal: 299,
    stock: 64,
    batchNo: "BATCH-2026-0021-44890",
    description: "LDS lidar mapping, mop & sweep, 150min runtime, 4000Pa.",
  },
  {
    id: "P-1022",
    name: "Smart Thermostat Wi-Fi",
    category: "home",
    priceUsd: 99,
    priceUsdOriginal: 129,
    stock: 180,
    batchNo: "BATCH-2026-0022-91204",
    description:
      "Programmable Wi-Fi thermostat, supports Matter/HomeKit/Google.",
  },
  {
    id: "P-1023",
    name: "Memory Foam Pillow Set",
    category: "home",
    priceUsd: 39.99,
    priceUsdOriginal: 59.99,
    stock: 410,
    batchNo: "BATCH-2026-0023-31144",
    description:
      "Cervical-support pillows, certified OEKO-TEX, breathable cover, set of 2.",
  },
  {
    id: "P-1024",
    name: "Adjustable LED Desk Lamp",
    category: "home",
    priceUsd: 24.5,
    priceUsdOriginal: 35,
    stock: 320,
    batchNo: "BATCH-2026-0024-78014",
    description:
      "Eye-care LED lamp, 5 color temps, USB charging port, dimmable touch panel.",
  },
  {
    id: "P-1025",
    name: "Mesh Wi-Fi 6 Tri-Band",
    category: "home",
    priceUsd: 179,
    priceUsdOriginal: 249,
    stock: 88,
    batchNo: "BATCH-2026-0025-29013",
    description:
      "Whole-home AX1800 tri-band mesh Wi-Fi 6 system, covers 5500 sqft.",
  },

  // ============== Industrial ==============
  {
    id: "P-1009",
    name: "Pallet Jack 2.5 Ton",
    category: "industrial",
    priceUsd: 339,
    priceUsdOriginal: 459,
    stock: 18,
    batchNo: "BATCH-2026-0009-90814",
    description:
      "Steel pallet jack with polyurethane wheels, 2500 kg capacity.",
  },
  {
    id: "P-1026",
    name: "Hydraulic Cart 500kg",
    category: "industrial",
    priceUsd: 219,
    priceUsdOriginal: 299,
    stock: 32,
    batchNo: "BATCH-2026-0026-50122",
    description:
      "Foot-pump hydraulic platform cart, 500kg load, 360 swivel casters.",
  },
  {
    id: "P-1027",
    name: "Cordless Impact Wrench",
    category: "industrial",
    priceUsd: 149,
    priceUsdOriginal: 219,
    stock: 76,
    batchNo: "BATCH-2026-0027-78021",
    description:
      "Brushless 1/2-inch impact wrench, 480Nm torque, 2x 4.0Ah batteries.",
  },
  {
    id: "P-1028",
    name: "Laser Distance Meter 80m",
    category: "industrial",
    priceUsd: 49.9,
    priceUsdOriginal: 69.9,
    stock: 220,
    batchNo: "BATCH-2026-0028-44120",
    description:
      "IP54 80m laser meter, 2mm accuracy, with bubble level and area/volume calc.",
  },
  {
    id: "P-1029",
    name: "Air Compressor 50L",
    category: "industrial",
    priceUsd: 289,
    stock: 12,
    batchNo: "BATCH-2026-0029-22413",
    description:
      "Oil-free belt-drive compressor, 50L tank, 8 bar, 2.0 HP induction motor.",
  },
  {
    id: "P-1030",
    name: "Heavy Bench Vise 6 inch",
    category: "industrial",
    priceUsd: 79,
    priceUsdOriginal: 109,
    stock: 90,
    batchNo: "BATCH-2026-0030-99021",
    description:
      "Cast iron 6-inch bench vise, swivel base, anvil & pipe jaws.",
  },
  {
    id: "P-1031",
    name: "Industrial Multimeter Pro",
    category: "industrial",
    priceUsd: 59,
    priceUsdOriginal: 79,
    stock: 240,
    batchNo: "BATCH-2026-0031-66019",
    description:
      "True-RMS multimeter, CAT III 600V, NCV, capacitance, frequency, temperature.",
  },
  {
    id: "P-1032",
    name: "Soldering Station Digital",
    category: "industrial",
    priceUsd: 89,
    priceUsdOriginal: 119,
    stock: 130,
    batchNo: "BATCH-2026-0032-44120",
    description:
      "ESD-safe digital soldering station, 90W, 200-480 deg C, sleep mode auto-cooling.",
  },
  {
    id: "P-1033",
    name: "Stainless Workbench 1.5m",
    category: "industrial",
    priceUsd: 459,
    priceUsdOriginal: 599,
    stock: 14,
    batchNo: "BATCH-2026-0033-77013",
    description: "304 stainless workbench with under-shelf, ESD-safe surface.",
  },
  {
    id: "P-1034",
    name: "Pneumatic Brad Nailer",
    category: "industrial",
    priceUsd: 69,
    priceUsdOriginal: 95,
    stock: 152,
    batchNo: "BATCH-2026-0034-22011",
    description: "18-gauge pneumatic brad nailer, 5/8-2 inch range, 70-120psi.",
  },

  // ============== PPE ==============
  {
    id: "P-1001",
    name: "Industrial Safety Helmet",
    category: "ppe",
    priceUsd: 39.9,
    priceUsdOriginal: 54.9,
    stock: 70,
    batchNo: "BATCH-2026-0001-77821",
    description:
      "ANSI Z89.1 certified hard hat with adjustable suspension and reflective decals.",
  },
  {
    id: "P-1002",
    name: "Anti-static Gloves",
    category: "ppe",
    priceUsd: 12.5,
    stock: 240,
    batchNo: "BATCH-2026-0002-90341",
    description:
      "ESD-safe nylon gloves with carbon fibre weave for electronics assembly lines.",
  },
  {
    id: "P-1006",
    name: "High Visibility Vest",
    category: "ppe",
    priceUsd: 9.9,
    priceUsdOriginal: 14.9,
    stock: 380,
    batchNo: "BATCH-2026-0006-30815",
    description: "Class 2 reflective vest, breathable mesh fabric.",
  },
  {
    id: "P-1035",
    name: "N95 Respirator Box of 50",
    category: "ppe",
    priceUsd: 34.9,
    priceUsdOriginal: 49.9,
    stock: 1200,
    batchNo: "BATCH-2026-0035-90821",
    description: "NIOSH N95 respirator masks, 50 pieces / box, individually packed.",
  },
  {
    id: "P-1036",
    name: "Cut-resistant Gloves",
    category: "ppe",
    priceUsd: 11.5,
    priceUsdOriginal: 16.5,
    stock: 540,
    batchNo: "BATCH-2026-0036-22019",
    description: "ANSI A5 cut-resistant gloves with HPPE liner and PU coating.",
  },
  {
    id: "P-1037",
    name: "Auto-darkening Welding Helmet",
    category: "ppe",
    priceUsd: 89,
    priceUsdOriginal: 129,
    stock: 88,
    batchNo: "BATCH-2026-0037-44091",
    description:
      "Variable shade DIN 9-13, 1/1/1/2 optical clarity, grind mode, MIG/TIG/Stick.",
  },
  {
    id: "P-1038",
    name: "Heavy-duty Knee Pads",
    category: "ppe",
    priceUsd: 19.9,
    priceUsdOriginal: 27.9,
    stock: 410,
    batchNo: "BATCH-2026-0038-12881",
    description: "Gel-cushion knee pads with non-slip thermoplastic shell.",
  },
  {
    id: "P-1039",
    name: "Earmuffs NRR 27dB",
    category: "ppe",
    priceUsd: 17.5,
    priceUsdOriginal: 22.5,
    stock: 380,
    batchNo: "BATCH-2026-0039-77810",
    description:
      "Foldable earmuffs with NRR 27 dB rating, suitable for industrial sites.",
  },
  {
    id: "P-1040",
    name: "Anti-fog Safety Goggles",
    category: "ppe",
    priceUsd: 8.9,
    priceUsdOriginal: 11.9,
    stock: 880,
    batchNo: "BATCH-2026-0040-65021",
    description:
      "Anti-fog UV400 safety goggles, ANSI Z87.1+, fits over prescription eyewear.",
  },
  {
    id: "P-1041",
    name: "Steel Toe Work Boots",
    category: "ppe",
    priceUsd: 79.9,
    priceUsdOriginal: 109.9,
    stock: 220,
    batchNo: "BATCH-2026-0041-29021",
    description:
      "Waterproof leather work boots, steel toe, slip-resistant, ASTM compliant.",
  },

  // ============== Logistics ==============
  {
    id: "P-1004",
    name: "Heavy-duty Cargo Strap",
    category: "logistics",
    priceUsd: 22.3,
    priceUsdOriginal: 29.3,
    stock: 130,
    batchNo: "BATCH-2026-0004-12450",
    description:
      "5000 lbs polyester ratchet strap, ideal for cross-border container logistics.",
  },
  {
    id: "P-1042",
    name: "Stretch Film Wrap Roll",
    category: "logistics",
    priceUsd: 18.9,
    priceUsdOriginal: 24.9,
    stock: 960,
    batchNo: "BATCH-2026-0042-12011",
    description:
      "20 inch x 1500 ft commercial-grade stretch wrap, 80 gauge.",
  },
  {
    id: "P-1043",
    name: "Folding Logistics Cart",
    category: "logistics",
    priceUsd: 79,
    priceUsdOriginal: 119,
    stock: 84,
    batchNo: "BATCH-2026-0043-44129",
    description:
      "Foldable 4-wheel platform cart, 200kg capacity, removable frame.",
  },
  {
    id: "P-1044",
    name: "Forklift Tine Cap Set",
    category: "logistics",
    priceUsd: 39,
    stock: 220,
    batchNo: "BATCH-2026-0044-99201",
    description: "Set of 2 fork extension caps, 60-inch length, fits 6 inch forks.",
  },
  {
    id: "P-1045",
    name: "Bubble Mailer 200 Pack",
    category: "logistics",
    priceUsd: 29.9,
    priceUsdOriginal: 39.9,
    stock: 1500,
    batchNo: "BATCH-2026-0045-13002",
    description:
      "Self-seal padded bubble mailers, water-resistant, 200 pcs / pack.",
  },
  {
    id: "P-1046",
    name: "Manual Strapping Machine",
    category: "logistics",
    priceUsd: 119,
    priceUsdOriginal: 159,
    stock: 38,
    batchNo: "BATCH-2026-0046-22014",
    description:
      "Manual PP strap tensioner + sealer combo for heavy-duty packing.",
  },
  {
    id: "P-1047",
    name: "Pallet Wrap Dispenser",
    category: "logistics",
    priceUsd: 35,
    priceUsdOriginal: 49,
    stock: 156,
    batchNo: "BATCH-2026-0047-11034",
    description:
      "Heavy-duty steel handle dispenser for stretch film, fits 18-20 inch rolls.",
  },
  {
    id: "P-1048",
    name: "Heavy Duty Hand Truck",
    category: "logistics",
    priceUsd: 99,
    priceUsdOriginal: 139,
    stock: 110,
    batchNo: "BATCH-2026-0048-78201",
    description:
      "300 kg capacity hand truck with stair climbers and pneumatic tires.",
  },
  {
    id: "P-1049",
    name: "Cargo Net 2.5 x 4m",
    category: "logistics",
    priceUsd: 49,
    priceUsdOriginal: 69,
    stock: 80,
    batchNo: "BATCH-2026-0049-12121",
    description:
      "Heavy-duty truck cargo net 2.5x4m with bungee perimeter.",
  },
];

export const products: Product[] = PRODUCT_SEEDS.map((seed) => ({
  ...seed,
  imageUrl: resolveProductImageUrl(seed.id, seed.name, seed.category),
}));

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

/** 计算折扣百分比，未促销返回 0 */
export function calculateDiscountPercent(product: Product) {
  if (!product.priceUsdOriginal || product.priceUsdOriginal <= product.priceUsd) {
    return 0;
  }
  return Math.round(
    ((product.priceUsdOriginal - product.priceUsd) / product.priceUsdOriginal) *
      100,
  );
}
