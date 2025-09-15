import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { MarketChart } from "@/components/ui/market-chart";
import { mockMarketStats, mockMarkets, mockMarketCharts } from "@/lib/mock-data";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Shield, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Lock, 
  Globe, 
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Star
} from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const topMarkets = mockMarkets.slice(0, 3);
  const featuresRef = useRef(null);
  const marketsRef = useRef(null);
  const isFeatureInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const isMarketsInView = useInView(marketsRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Enhanced Hero Section */}
      <ParallaxBackground imageUrl={heroImage} className="min-h-screen flex items-center">
        <div className="container mx-auto max-w-7xl px-6 py-24 relative z-10">
          <motion.div 
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge variant="secondary" className="bg-brand-500/20 text-brand-300 border-brand-500/30 backdrop-blur-sm px-4 py-2">
                  <Sparkles className="w-3 h-3 mr-2" />
                  Stellar Blockchain • Soroban Smart Contracts
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-display-1 font-semibold text-fg-primary max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Panorama Block
                <motion.span 
                  className="block text-brand-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  Native on Stellar
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-body-1 text-fg-secondary max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Professional-grade lending protocol for Real-World Assets with permissioned markets, 
                hybrid oracles, and institutional compliance. Built on Stellar's Soroban platform.
              </motion.p>
            </div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="btn-primary px-8 py-4 text-body-1 relative overflow-hidden group">
                  <span className="relative z-10">Connect Wallet</span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="px-8 py-4 text-body-1 backdrop-blur-sm border-brand-500/30 hover:bg-brand-500/10">
                  View Markets
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Live Stats Preview */}
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <div className="text-center space-y-1 sm:space-y-2 bg-card/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-brand-500/20">
                <AnimatedCounter value={mockMarketStats.totalValueLocked} className="text-h2 font-semibold text-brand-400 tabular-nums" />
                <p className="text-micro text-fg-muted uppercase tracking-wide hidden sm:block">Total Value Locked</p>
                <p className="text-micro text-fg-muted uppercase tracking-wide sm:hidden">TVL</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2 bg-card/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-brand-500/20">
                <AnimatedCounter value={mockMarketStats.totalMarkets.toString()} className="text-h2 font-semibold text-brand-400 tabular-nums" />
                <p className="text-micro text-fg-muted uppercase tracking-wide hidden sm:block">Active Markets</p>
                <p className="text-micro text-fg-muted uppercase tracking-wide sm:hidden">Markets</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2 bg-card/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-brand-500/20">
                <AnimatedCounter value={mockMarketStats.totalUsers.toString()} className="text-h2 font-semibold text-brand-400 tabular-nums" />
                <p className="text-micro text-fg-muted uppercase tracking-wide hidden sm:block">Institutions</p>
                <p className="text-micro text-fg-muted uppercase tracking-wide sm:hidden">Users</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2 bg-card/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-brand-500/20">
                <AnimatedCounter value={mockMarketStats.avgUtilization} className="text-h2 font-semibold text-brand-400 tabular-nums" />
                <p className="text-micro text-fg-muted uppercase tracking-wide hidden sm:block">Avg Utilization</p>
                <p className="text-micro text-fg-muted uppercase tracking-wide sm:hidden">Util.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-black/20 to-bg-black pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      </ParallaxBackground>

      {/* Enhanced Stats Section */}
      <section className="container mx-auto max-w-7xl px-6 py-20 -mt-16 relative z-20">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Total Value Locked"
              value={mockMarketStats.totalValueLocked}
              icon={DollarSign}
              trend="up"
              trendValue="+12.5%"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Active Markets"
              value={mockMarketStats.totalMarkets.toString()}
              icon={BarChart3}
              subtitle="Permissioned protocols"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Institutional Users"
              value={mockMarketStats.totalUsers.toString()}
              icon={Users}
              trend="up"
              trendValue="+8 this week"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Average Utilization"
              value={mockMarketStats.avgUtilization}
              icon={TrendingUp}
              trend="neutral"
              trendValue="Stable"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Enhanced Features Section */}
      <section ref={featuresRef} className="container mx-auto max-w-7xl px-6 py-20">
        <motion.div 
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-h1 font-semibold text-fg-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Institutional-Grade Infrastructure
          </motion.h2>
          <motion.p 
            className="text-body-1 text-fg-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Purpose-built for professional asset managers, treasuries, and institutional investors.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={isFeatureInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, staggerChildren: 0.1 }}
        >
          {[
            {
              icon: Shield,
              title: "Permissioned Markets",
              description: "KYC/KYB compliance with role-based access controls and regulatory transparency.",
              color: "text-green-400"
            },
            {
              icon: Globe,
              title: "Hybrid Oracles",
              description: "Reflector on-chain prices combined with NAV attestations from custodians.",
              color: "text-blue-400"
            },
            {
              icon: Zap,
              title: "Efficient Capital",
              description: "P2P matching with pool fallback inspired by Morpho for optimal utilization.",
              color: "text-yellow-400"
            },
            {
              icon: BarChart3,
              title: "Risk Premiums", 
              description: "Granular risk modeling with base rates plus asset-specific premiums.",
              color: "text-purple-400"
            },
            {
              icon: Lock,
              title: "Stellar Native",
              description: "Built on Soroban smart contracts with native Stellar asset integration.",
              color: "text-indigo-400"
            },
            {
              icon: Users,
              title: "Institutional UX",
              description: "Professional dashboards, reporting, and treasury-grade position management.",
              color: "text-pink-400"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={isFeatureInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="group"
            >
              <Card className="card-institutional hover-lift h-full relative overflow-hidden border-brand-500/20">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="space-y-6 relative z-10">
                  <motion.div 
                    className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <feature.icon className={`h-7 w-7 text-brand-400 group-hover:${feature.color} transition-colors`} />
                  </motion.div>
                  <div className="space-y-3">
                    <h3 className="text-h3 font-semibold text-fg-primary group-hover:text-brand-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-body-2 text-fg-secondary leading-relaxed group-hover:text-fg-primary/90 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Enhanced Markets Preview */}
      <section ref={marketsRef} className="container mx-auto max-w-7xl px-6 py-20 bg-gradient-to-b from-transparent via-bg-elev-1/30 to-transparent">
        <motion.div 
          className="text-center space-y-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-h1 font-semibold text-fg-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Active Markets
            <motion.span 
              className="inline-block ml-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Star className="h-6 w-6 text-brand-400 inline" />
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-body-1 text-fg-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Institutional-grade Real-World Asset markets with regulated access and competitive yields.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0 }}
          animate={isMarketsInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, staggerChildren: 0.15 }}
        >
          {topMarkets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 60, rotateX: 45 }}
              animate={isMarketsInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 60, rotateX: 45 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              whileHover={{ y: -12, scale: 1.03 }}
              className="group perspective-1000"
            >
              <Card className="card-institutional hover-lift h-full relative overflow-hidden border-brand-500/30 group-hover:border-brand-400/50 transition-all duration-300">
                {/* Animated background gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={false}
                  whileHover={{
                    background: [
                      "linear-gradient(135deg, rgba(77,178,255,0.1) 0%, transparent 50%, rgba(77,178,255,0.05) 100%)",
                      "linear-gradient(225deg, rgba(77,178,255,0.1) 0%, transparent 50%, rgba(77,178,255,0.05) 100%)",
                      "linear-gradient(315deg, rgba(77,178,255,0.1) 0%, transparent 50%, rgba(77,178,255,0.05) 100%)",
                      "linear-gradient(135deg, rgba(77,178,255,0.1) 0%, transparent 50%, rgba(77,178,255,0.05) 100%)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <Badge variant="outline" className="text-micro border-brand-500/40 text-brand-300">
                        {market.assetSymbol}
                      </Badge>
                    </motion.div>
                    <Badge variant="secondary" className="text-micro bg-green-500/10 text-green-400 border-green-500/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-h3 font-semibold text-fg-primary group-hover:text-brand-300 transition-colors">
                      {market.name}
                    </h3>
                    <p className="text-body-2 text-fg-muted group-hover:text-fg-secondary transition-colors">
                      Min. Investment: <span className="text-brand-400 font-medium">{market.minInvestment}</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <motion.div 
                      className="text-center p-3 rounded-lg bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">Supply APY</p>
                      <AnimatedCounter 
                        value={market.supplyApy} 
                        className="text-h3 font-semibold text-brand-400 tabular-nums"
                      />
                    </motion.div>
                    <motion.div 
                      className="text-center p-3 rounded-lg bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <p className="text-micro text-fg-muted uppercase tracking-wide mb-1">TVL</p>
                      <AnimatedCounter 
                        value={market.totalSupply} 
                        className="text-h3 font-semibold text-fg-primary tabular-nums group-hover:text-brand-300 transition-colors"
                      />
                    </motion.div>
                  </div>
                  
                  {/* Utilization Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-micro text-fg-muted">Utilization</span>
                      <span className="text-micro text-brand-400 font-medium">{market.utilization}</span>
                    </div>
                    <div className="w-full bg-bg-elev-2 rounded-full h-2">
                      <motion.div 
                        className="h-2 bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: market.utilization }}
                        transition={{ duration: 1.5, delay: index * 0.2 }}
                      />
                    </div>
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full group-hover:bg-brand-500/10 group-hover:border-brand-400/50 group-hover:text-brand-300 transition-all">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="btn-primary px-8 py-4 text-body-1 relative overflow-hidden group">
              <span className="relative z-10">Explore All Markets</span>
              <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{
                  background: [
                    "linear-gradient(45deg, #3A9FEA, #4DB2FF)",
                    "linear-gradient(135deg, #4DB2FF, #66BEFF)",
                    "linear-gradient(225deg, #66BEFF, #3A9FEA)",
                    "linear-gradient(315deg, #3A9FEA, #4DB2FF)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Market Analytics Section */}
      <section className="container mx-auto max-w-7xl px-6 py-20 bg-gradient-to-b from-transparent via-bg-elev-1/20 to-transparent">
        <motion.div 
          className="text-center space-y-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-h1 font-semibold text-fg-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Real-Time Market Analytics
          </motion.h2>
          <motion.p 
            className="text-body-1 text-fg-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Live market data and performance metrics updated in real-time across all institutional markets.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          <MarketChart
            title="Supply Rates"
            value="4.85%"
            change="+0.23%"
            changeType="up"
            data={mockMarketCharts.supplyRates}
            type="area"
            color="#10B981"
          />
          <MarketChart
            title="Borrow Rates"
            value="5.95%"
            change="-0.05%"
            changeType="down"
            data={mockMarketCharts.borrowRates}
            type="line"
            color="#EF4444"
          />
          <MarketChart
            title="Utilization"
            value="71.1%"
            change="+2.4%"
            changeType="up"
            data={mockMarketCharts.utilization}
            type="area"
            color="#8B5CF6"
          />
          <MarketChart
            title="24h Volume"
            value="$45.2M"
            change="+12.8%"
            changeType="up"
            data={mockMarketCharts.volume}
            type="line"
            color="#F59E0B"
          />
        </motion.div>

        {/* Live Data Indicators */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-3 bg-card/50 backdrop-blur-sm rounded-full px-6 py-3 border border-brand-500/30">
            <motion.div 
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-body-2 text-fg-secondary">Live data • Updated every 5 seconds</span>
            <Badge variant="outline" className="text-micro text-brand-400 border-brand-500/30">
              Real-time
            </Badge>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Section */}
      <section className="container mx-auto max-w-7xl px-6 py-20">
        <motion.div 
          className="text-center space-y-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-h1 font-semibold text-fg-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Trusted by Leading Institutions
          </motion.h2>
          <motion.p 
            className="text-body-1 text-fg-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join institutional investors who trust our platform for their RWA lending needs.
          </motion.p>
        </motion.div>

        {/* Partner Logos */}
        <motion.div 
          className="flex flex-wrap justify-center items-center gap-8 mb-16 opacity-60"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.6, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {["Stellar", "Soroban", "Meridian", "RWA Capital", "DeFi Partners", "Block Ventures"].map((partner, index) => (
            <motion.div
              key={partner}
              className="px-6 py-3 bg-card/50 rounded-lg border border-stroke-line/50"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, opacity: 0.8 }}
            >
              <span className="text-body-2 font-medium text-fg-muted">{partner}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, staggerChildren: 0.2 }}
          viewport={{ once: true }}
        >
          {[
            {
              quote: "The institutional-grade compliance and transparency gives us confidence to deploy significant capital.",
              author: "Sarah Chen",
              role: "CTO, Meridian Capital",
              avatar: "SC",
              rating: 5
            },
            {
              quote: "Seamless Stellar integration and professional UX makes treasury management effortless.",
              author: "Marcus Rodriguez",
              role: "Treasury Director, Block Ventures",
              avatar: "MR",
              rating: 5
            },
            {
              quote: "Superior yields with institutional-grade risk management. Exactly what we needed.",
              author: "Dr. Emily Watson",
              role: "Head of Investments, RWA Fund",
              avatar: "EW",
              rating: 5
            }
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="card-institutional h-full border-brand-500/20 bg-gradient-to-br from-card to-bg-elev-1">
                <div className="space-y-6">
                  {/* Star Rating */}
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.2 + i * 0.1 }}
                      >
                        <Star className="h-4 w-4 text-brand-400 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-body-2 text-fg-secondary italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-stroke-line/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-body-2 font-semibold text-fg-primary">{testimonial.author}</p>
                      <p className="text-micro text-fg-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Enhanced Trust Indicators */}
      <section className="container mx-auto max-w-7xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="card-institutional bg-gradient-to-br from-bg-elev-1 via-bg-elev-2 to-bg-elev-1 border-brand-500/30 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-brand-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
            
            <div className="text-center space-y-12 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-h2 font-semibold text-fg-primary mb-4">
                  Enterprise-Ready Platform
                </h2>
                <p className="text-body-1 text-fg-secondary max-w-2xl mx-auto">
                  Built with institutional standards from day one
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  {
                    icon: CheckCircle,
                    title: "Regulatory Compliant",
                    description: "Full KYC/KYB with jurisdiction controls and real-time monitoring",
                    highlight: "SOC 2 Type II"
                  },
                  {
                    icon: Shield,
                    title: "Audited & Secure",
                    description: "Smart contracts audited by leading security firms with bug bounties",
                    highlight: "$2M+ Bounty Pool"
                  },
                  {
                    icon: BarChart3,
                    title: "Real-Time Reporting",
                    description: "Institutional-grade analytics with custom reporting and API access",
                    highlight: "99.9% Uptime"
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="flex flex-col items-center space-y-4 group"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    whileHover={{ y: -5 }}
                  >
                    <motion.div 
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 group-hover:bg-brand-500/20 transition-all duration-300 border border-brand-500/20"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <item.icon className="h-8 w-8 text-brand-400" />
                    </motion.div>
                    <div className="space-y-2 text-center">
                      <Badge variant="outline" className="text-micro text-brand-400 border-brand-500/30 mb-2">
                        {item.highlight}
                      </Badge>
                      <h3 className="text-h3 font-semibold text-fg-primary group-hover:text-brand-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-body-2 text-fg-secondary text-center leading-relaxed max-w-xs">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative border-t border-stroke-line bg-gradient-to-b from-card to-bg-elev-1 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-px h-full bg-brand-400" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-brand-400" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-brand-400" />
        </div>
        
        <div className="container mx-auto max-w-7xl px-6 py-16 relative z-10">
          <motion.div 
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="flex items-center justify-center space-x-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div className="text-2xl font-bold text-primary-foreground">R</div>
              </motion.div>
              <div className="text-left">
                <span className="text-h2 font-semibold text-fg-primary">Panorama Block</span>
                <p className="text-micro text-brand-400 font-medium">Institutional DeFi</p>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-body-1 text-fg-muted max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Institutional Real-World Asset lending on Stellar • Built with Soroban Smart Contracts
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-8 text-body-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {[
                { href: "/docs", label: "Documentation" },
                { href: "/kyc", label: "KYC Portal" }, 
                { href: "/markets", label: "Markets" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/admin", label: "Admin" }
              ].map((link, index) => (
                <motion.a 
                  key={link.href}
                  href={link.href} 
                  className="text-fg-secondary hover:text-brand-400 transition-colors relative group"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </motion.div>
            
            <motion.div 
              className="pt-8 border-t border-stroke-line/50"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-micro text-fg-muted">
                © 2024 Panorama Block. Built on Stellar Blockchain.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;