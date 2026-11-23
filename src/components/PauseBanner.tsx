import { CLAIMS_PAUSED } from "@/lib/site";

/** Site-wide notice while claims are paused. */
export default function PauseBanner() {
  if (!CLAIMS_PAUSED) return null;
  return (
    <div className="border-b border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-center text-sm text-yellow-200">
      Tasks are paused for maintenance — claiming and creating tasks are temporarily disabled. Funds in the contracts are safe.
    </div>
  );
}
