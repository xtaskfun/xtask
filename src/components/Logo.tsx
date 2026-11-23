import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <Image src="/logo.png" alt="xtask.fun" width={32} height={32} className="rounded-lg" priority />
      <span className="text-lg">
        xtask<span className="text-rainbow">.fun</span>
      </span>
    </Link>
  );
}
