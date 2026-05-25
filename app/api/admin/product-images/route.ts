import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { products } from "@/lib/products";

export const runtime = "nodejs";

const PRODUCT_IMAGES_PATH = path.join(process.cwd(), "lib", "product-images.json");
const PUBLIC_PRODUCTS_DIR = path.join(process.cwd(), "public", "products");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

type ProductImagesMap = Record<string, string>;

async function readProductImages(): Promise<ProductImagesMap> {
  const raw = await fs.readFile(PRODUCT_IMAGES_PATH, "utf8");
  return JSON.parse(raw) as ProductImagesMap;
}

async function writeProductImages(data: ProductImagesMap) {
  await fs.writeFile(PRODUCT_IMAGES_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function ensurePublicProductsDir() {
  await fs.mkdir(PUBLIC_PRODUCTS_DIR, { recursive: true });
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getTargetProductId(fileName: string, mode: string, productId?: string) {
  if (mode === "manual") {
    return productId;
  }
  const base = path.basename(fileName, path.extname(fileName));
  return products.some((product) => product.id === base) ? base : undefined;
}

export async function GET() {
  const images = await readProductImages();
  return NextResponse.json({ ok: true, images });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const mode = String(formData.get("mode") ?? "manual");
  const productId = String(formData.get("productId") ?? "");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ ok: false, message: "没有收到图片文件" }, { status: 400 });
  }

  if (mode === "manual" && !productId) {
    return NextResponse.json({ ok: false, message: "请先选择商品" }, { status: 400 });
  }

  await ensurePublicProductsDir();
  const images = await readProductImages();
  const updates: Array<{ productId: string; filename: string; url: string }> = [];

  for (const file of files) {
    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ ok: false, message: `不支持的文件类型: ${file.name}` }, { status: 400 });
    }

    const targetProductId = getTargetProductId(file.name, mode, productId);
    if (!targetProductId) {
      return NextResponse.json({ ok: false, message: `无法识别商品 ID: ${file.name}` }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name);
    const storedName = mode === "manual" ? `${targetProductId}${extension}` : safeName;
    const targetPath = path.join(PUBLIC_PRODUCTS_DIR, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(targetPath, buffer);
    images[targetProductId] = `/products/${storedName}`;
    updates.push({ productId: targetProductId, filename: storedName, url: images[targetProductId] });
  }

  await writeProductImages(images);
  return NextResponse.json({ ok: true, updates });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ ok: false, message: "缺少 productId" }, { status: 400 });
  }

  const images = await readProductImages();
  const currentPath = images[productId];
  if (!currentPath) {
    return NextResponse.json({ ok: false, message: "该商品没有已配置图片" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", currentPath.replace(/^\//, ""));
  await fs.rm(filePath, { force: true });
  delete images[productId];
  await writeProductImages(images);

  return NextResponse.json({ ok: true, productId });
}
