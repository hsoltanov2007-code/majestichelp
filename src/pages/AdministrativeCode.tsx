import { LegalCodePage } from "@/components/LegalCodePage";

export default function AdministrativeCode() {
  return (
    <LegalCodePage
      sourceShortName="АК"
      title="Административный кодекс"
      favoriteType="administrative"
      icon="📜"
      basePath="/administrative-code"
    />
  );
}
