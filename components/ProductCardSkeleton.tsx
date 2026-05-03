// 商品卡片骨架屏：使用 shimmer-gradient 背景模拟流光效果
export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square animate-shimmer rounded-lg bg-slate-100 bg-shimmer-gradient bg-[length:450px_100%]" />
      <div className="mt-3 h-3 w-3/4 animate-shimmer rounded bg-slate-100 bg-shimmer-gradient bg-[length:450px_100%]" />
      <div className="mt-2 h-3 w-1/3 animate-shimmer rounded bg-slate-100 bg-shimmer-gradient bg-[length:450px_100%]" />
      <div className="mt-2 h-4 w-1/2 animate-shimmer rounded bg-slate-100 bg-shimmer-gradient bg-[length:450px_100%]" />
    </div>
  );
}
