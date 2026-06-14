export default function PotBadge({ pot }: { pot: number | null }) {
  return <span className={`pot-badge ${pot ? `pot-${pot}` : ""}`}>P{pot ?? "?"}</span>;
}
