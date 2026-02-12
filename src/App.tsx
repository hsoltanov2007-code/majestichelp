import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ViewModeProvider } from "@/hooks/useViewMode";
import { LegalChatBot } from "@/components/LegalChatBot";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
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
import LawsList from "./pages/LawsList";
import LawDetail from "./pages/LawDetail";
import AdminLaws from "./pages/AdminLaws";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";

import GovernmentRules from "./pages/GovernmentRules";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumTopic from "./pages/ForumTopic";
import NewTopic from "./pages/NewTopic";
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
        <Route path="/legal-reference" element={<LegalReference />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/laws" element={<LawsList />} />
        <Route path="/laws/:lawId" element={<LawDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/category/:id" element={<ForumCategory />} />
        <Route path="/forum/topic/:id" element={<ForumTopic />} />
        <Route path="/forum/new-topic" element={<NewTopic />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      <LegalChatBot />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ViewModeProvider>
      <TooltipProvider>
        <AnimatedBackground />
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </TooltipProvider>
    </ViewModeProvider>
  </QueryClientProvider>
);

export default App;
