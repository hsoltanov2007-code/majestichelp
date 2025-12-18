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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
