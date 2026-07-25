import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ViewModeProvider } from "@/hooks/useViewMode";

import AnimatedBackground from "@/components/AnimatedBackground";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { TelegramAuthProvider } from "@/components/TelegramAuthProvider";
import Index from "./pages/Index";
import CriminalCode from "./pages/CriminalCode";
import AdministrativeCode from "./pages/AdministrativeCode";
import TrafficCode from "./pages/TrafficCode";
import Procedures from "./pages/Procedures";
import LegalReference from "./pages/LegalReference";
import Instructions from "./pages/Instructions";
import Favorites from "./pages/Favorites";
import Glossary from "./pages/Glossary";
import FAQ from "./pages/FAQ";
import ProceduralCode from "./pages/ProceduralCode";
import ClosedTerritories from "./pages/ClosedTerritories";
import LawsList from "./pages/LawsList";
import LawDetail from "./pages/LawDetail";
import AdminLaws from "./pages/AdminLaws";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";

import GovernmentRules from "./pages/GovernmentRules";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Media from "./pages/Media";
import News from "./pages/News";
import AppView from "./pages/AppView";
import CheatSheet from "./pages/CheatSheet";
import Giveaways from "./pages/Giveaways";
import AdminGiveaways from "./pages/AdminGiveaways";
import AdminSupport from "./pages/AdminSupport";
import AdminAds from "./pages/AdminAds";
import Redux from "./pages/Redux";
import AdminRedux from "./pages/AdminRedux";
import BannerGenerator from "./pages/BannerGenerator";
import BeginnerGuide from "./pages/BeginnerGuide";
import ImageHost from "./pages/ImageHost";
import ImageView from "./pages/ImageView";
const queryClient = new QueryClient();

// Wrapper component to use hooks inside HashRouter
function AppContent() {
  useGlobalSearch(); // Activates Ctrl+F listener globally
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/criminal-code" element={<CriminalCode />} />
        <Route path="/administrative-code" element={<AdministrativeCode />} />
        <Route path="/traffic-code" element={<TrafficCode />} />
        <Route path="/procedures" element={<Procedures />} />
        <Route path="/government-rules" element={<GovernmentRules />} />
        <Route path="/procedural-code" element={<ProceduralCode />} />
        <Route path="/closed-territories" element={<ClosedTerritories />} />
        <Route path="/legal-reference" element={<LegalReference />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/laws" element={<AdminLaws />} />
        <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/media" element={<Media />} />
        <Route path="/news" element={<News />} />
        <Route path="/app" element={<AppView />} />
        <Route path="/cheat-sheet" element={<CheatSheet />} />
        <Route path="/giveaways" element={<Giveaways />} />
        <Route path="/admin/giveaways" element={<AdminGiveaways />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        <Route path="/admin/ads" element={<AdminAds />} />
        <Route path="/redux" element={<Redux />} />
        <Route path="/admin/redux" element={<AdminRedux />} />
        <Route path="/banner-generator" element={<BannerGenerator />} />
        <Route path="/beginner-guide" element={<BeginnerGuide />} />
        <Route path="/image-host" element={<ImageHost />} />
        <Route path="/i/:slug" element={<ImageView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ViewModeProvider>
      <TooltipProvider>
        <TelegramAuthProvider>
          <AnimatedBackground />
          <Toaster />
          <Sonner />
          <HashRouter>
            <AppContent />
          </HashRouter>
        </TelegramAuthProvider>
      </TooltipProvider>
    </ViewModeProvider>
  </QueryClientProvider>
);

export default App;
