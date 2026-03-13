import { LegalCodePage } from "@/components/LegalCodePage";

export default function TrafficCode() {
  return (
    <LegalCodePage
      sourceShortName="ДК"
      title="Дорожный кодекс"
      favoriteType="traffic"
      icon="🚗"
      basePath="/traffic-code"
    />
  );
}
