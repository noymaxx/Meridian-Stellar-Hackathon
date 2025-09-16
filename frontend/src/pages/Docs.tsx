import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Shield, AlertTriangle, Info, ExternalLink, Copy, Check } from "lucide-react";

export default function Docs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    {
      id: "overview",
      title: "Overview",
      content: `PanoramaBlock introduces SRWA: a SEP-41–compatible fungible token with ERC-3643–inspired identity & compliance. SRWA moves compliance to the asset layer so every dApp that can move a SEP-41 token can automatically respect regulation.`
    },
    {
      id: "architecture",
      title: "System Architecture Overview",
      content: `The SRWA ecosystem follows a token-first compliance approach with core layers including SRWA Token, Compliance Core, Identity Registry, and integration layers with Blend Money Market, SoroSwap AMM, Reflector Oracle, and DeFindex.`,
      image: "/docs/photo2Doc.png"
    },
    {
      id: "token-architecture",
      title: "Token-first Architecture",
      content: `The SRWA ecosystem follows a token-first compliance approach where compliance is built into the token itself, ensuring that every dApp that can move a SEP-41 token can automatically respect regulation.`,
      image: "/docs/photo3Doc.png"
    },
    {
      id: "use-cases",
      title: "Institutional Use-cases",
      content: `Treasury Credit backed by T-Bills, Private Credit/Receivables, and CRE/Bridge Loans with specific constraints and operational rules for each asset class.`,
      image: "/docs/photo4Doc.png"
    },
    {
      id: "risks",
      title: "Risks, Assumptions & Mitigations",
      content: `Comprehensive risk assessment matrix covering compliance bypass, wrong/forged claims, NAV stale/oracle failure, liquidity shock, governance mistakes, data drift, and privacy leakage.`,
      image: "/docs/photo5Doc.png"
    },
    {
      id: "contracts",
      title: "Contract Architecture",
      content: `Detailed contract structure including SRWA token, compliance core, identity registry, and all supporting modules.`,
      image: "/docs/photo6Doc.png"
    },
    {
      id: "dataflow",
      title: "Dataflow Diagram",
      content: `Shows the flow from feeds through adapter to consumers in the oracle system.`,
      image: "/docs/photo7Doc.png"
    },
    {
      id: "degraded-mode",
      title: "Degraded Mode State Machine",
      content: `Illustrates the state transitions when the system enters degraded mode due to oracle failures or other issues.`,
      image: "/docs/Photo8Doc.png"
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-h1 font-semibold text-fg-primary mb-4 flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            PanoramaBlock - SRWA Standard Documentation
          </h1>
          <p className="text-body-1 text-fg-secondary mb-6">
            Comprehensive documentation for the SRWA (Stellar Real-World Asset) standard and the PanoramaBlock ecosystem for institutional RWA lending on Stellar.
          </p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {filteredSections.map((section, index) => (
            <Card key={section.id} className="card-institutional">
              <div className="p-6">
                <h2 className="text-h2 font-semibold text-fg-primary mb-4 flex items-center gap-2">
                  {section.title}
                  <Badge variant="secondary" className="text-xs">
                    Section {index + 1}
                  </Badge>
                </h2>
                
                {section.image && (
                  <div className="mb-6">
                    <img 
                      src={section.image} 
                      alt={section.title}
                      className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
                
                <p className="text-body-1 text-fg-secondary mb-4">
                  {section.content}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Compliance
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    Technical
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <Card className="card-institutional">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-fg-muted mx-auto mb-4" />
              <h3 className="text-h3 font-semibold text-fg-primary mb-2">
                No results found
              </h3>
              <p className="text-body-1 text-fg-secondary">
                Try adjusting your search terms or browse all sections.
              </p>
            </div>
          </Card>
        )}

        <div className="mt-12">
          <Card className="card-institutional">
            <div className="p-6">
              <h2 className="text-h2 font-semibold text-fg-primary mb-4">
                Quick Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a 
                  href="#overview" 
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Overview</span>
                </a>
                <a 
                  href="#architecture" 
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>Architecture</span>
                </a>
                <a 
                  href="#risks" 
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Assessment</span>
                </a>
                <a 
                  href="https://developers.stellar.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Stellar Docs</span>
                </a>
                <a 
                  href="https://soroswap.finance" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>SoroSwap</span>
                </a>
                <a 
                  href="https://reflector.network" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Reflector Oracle</span>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

/*
CÓDIGO ORIGINAL COMENTADO - DESCOMENTE QUANDO NECESSÁRIO

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Shield, AlertTriangle, Info, ExternalLink, Copy, Check } from "lucide-react";

// ... resto do código original comentado ...
*/