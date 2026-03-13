import { LegalCodePage } from "@/components/LegalCodePage";

const ProceduralCode = () => {
  return (
    <LegalCodePage
      sourceShortName="ПК"
      title="Процессуальный кодекс"
      favoriteType="procedural"
      icon="📋"
      basePath="/procedural-code"
    />
  );
};

export default ProceduralCode;
