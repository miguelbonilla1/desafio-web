"use client";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[72px] md:w-20 bg-orange-600 z-40">
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-white/90 text-center">
        <div className="font-semibold">Zigpi</div>
      </div>
    </aside>
  );
}
