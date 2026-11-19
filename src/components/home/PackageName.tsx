import { splitBrandPhrase } from "./package-art";

export default function PackageName({ name }: { name: string }) {
  const parts = splitBrandPhrase(name);
  if (!parts) return <>{name}</>;
  return (
    <>
      {parts[0]}
      <span className="nb">{parts[1]}</span>
      {parts[2]}
    </>
  );
}
