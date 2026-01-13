import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ViewModeProvider } from "@/hooks/useViewMode";
import { LegalChatBot } from "@/components/LegalChatBot";
import AnimatedBackground from "@/components/AnimatedBackground";
import Index from "./pages/Index";
import CriminalCode from "./pages/CriminalCode";
import AdministrativeCode from "./pages/AdministrativeCode";
import TrafficCode from "./pages/TrafficCode";
import Procedures from "./pages/Procedures";
import LegalReference from "./pages/LegalReference";
import Instructions from "./pages/Instructions";
import Favorites from "./pages/Favorites";
import Calculator from "./pages/Calculator";
import Glossary from "./pages/Glossary";
import Scenarios from "./pages/Scenarios";
import FAQ from "./pages/FAQ";
import ProceduralCode from "./pages/ProceduralCode";
import Quiz from "./pages/Quiz";
import Laws from "./pages/Laws";

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
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ViewModeProvider>
      <TooltipProvider>
        <AnimatedBackground />
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/laws" element={<Laws />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/category/:id" element={<ForumCategory />} />
            <Route path="/forum/topic/:id" element={<ForumTopic />} />
            <Route path="/forum/new-topic" element={<NewTopic />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/media" element={<Media />} />
            <Route path="/news" element={<News />} />
            <Route path="/app" element={<AppView />} />
            
            <Route path="*" element={<NotFound />} />
        </Routes>
          <LegalChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </ViewModeProvider>
  </QueryClientProvider>
);

export default App;
