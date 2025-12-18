import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/criminal-code" element={<CriminalCode />} />
          <Route path="/administrative-code" element={<AdministrativeCode />} />
          <Route path="/traffic-code" element={<TrafficCode />} />
          <Route path="/procedures" element={<Procedures />} />
          <Route path="/legal-reference" element={<LegalReference />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
