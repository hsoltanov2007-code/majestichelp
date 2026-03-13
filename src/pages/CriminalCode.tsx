import { LegalCodePage } from "@/components/LegalCodePage";

export default function CriminalCode() {
  return (
    <LegalCodePage
      sourceShortName="УК"
      title="Уголовный кодекс"
      favoriteType="criminal"
      icon="📌"
      basePath="/criminal-code"
    />
  );
}
