import type { VaultDoc } from "@/store/useVaultStore";
import VaultCard from "./VaultCard";

export default function VaultGrid({ docs }: { docs: VaultDoc[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {docs.map((doc) => (
        <VaultCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}