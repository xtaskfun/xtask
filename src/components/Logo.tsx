import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-lg font-black text-black">
        𝕏
      </span>
      <span className="text-lg">
        xtask<span className="text-brand">.fun</span>
      </span>
    </Link>
  );
}
