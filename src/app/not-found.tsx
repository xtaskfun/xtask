import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <h1 className="text-5xl font-black">404</h1>
      <p className="mt-2 text-muted">This page doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}
