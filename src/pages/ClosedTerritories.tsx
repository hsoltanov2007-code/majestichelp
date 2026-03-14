import { LegalCodePage } from "@/components/LegalCodePage";

export default function ClosedTerritories() {
  return (
    <LegalCodePage
      sourceShortName="ЗТ"
      title="Закрытые и охраняемые территории"
      favoriteType="closed_territories"
      icon="🔒"
      basePath="/closed-territories"
    />
  );
}
