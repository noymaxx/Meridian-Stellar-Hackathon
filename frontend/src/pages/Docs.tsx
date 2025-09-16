// PÁGINA TEMPORARIAMENTE DESABILITADA
// Esta página será reativada quando necessário

import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

/**
 * Página de Documentação - Temporariamente desabilitada
 * 
 * Esta página contém a documentação técnica completa do projeto SRWA,
 * mas foi temporariamente desabilitada conforme solicitado.
 * 
 * Para reativar, descomente o código abaixo e remova este placeholder.
 */

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-4xl px-6 py-12">
        <Card className="card-institutional">
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-fg-muted mx-auto mb-6" />
            <h1 className="text-h1 font-semibold text-fg-primary mb-4">
              Documentação Temporariamente Indisponível
            </h1>
            <p className="text-body-1 text-fg-secondary mb-6">
              Esta página está temporariamente desabilitada e será reativada em breve.
            </p>
            <p className="text-body-2 text-fg-muted">
              A documentação técnica completa do projeto SRWA estará disponível em uma versão futura.
            </p>
          </div>
        </Card>
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