import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Hooks
import { useBlendPools } from '@/hooks/markets/useBlendPools';
import { useEnhancedPoolData } from '@/hooks/markets/useDefIndexData';
import { MarketsDashboard } from '@/components/markets/MarketsDashboard';
import { mockUserPositions, type UserPosition } from "@/lib/mock-data";

// Icons
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Activity,
  AlertTriangle,
  Plus,
  Minus,
  Users,
  Lock,
  Globe,
  Zap,
  RefreshCw,
  Sparkles
} from "lucide-react";

// Admin data
const lineData = [
  { date: "1/23", value: 0.8 },
  { date: "4/23", value: 1.2 },
  { date: "7/23", value: 1.9 },
  { date: "10/23", value: 2.7 },
  { date: "1/24", value: 3.2 },
  { date: "4/24", value: 3.9 },
  { date: "7/24", value: 4.6 },
  { date: "10/24", value: 1.3 },
  { date: "1/25", value: 6.1 },
  { date: "4/25", value: 6.7 },
  { date: "7/25", value: 7.2 },
];

const pieData = [
  { name: "Private Equity", value: 5300 },
  { name: "US Treasury Debt", value: 507 },
  { name: "non-US Government Debt", value: 304 },
  { name: "Institutional", value: 426 },
  { name: "Commodities", value: 179 },
  { name: "Private Credit", value: 275 },
];

const pieColors = ["#60A5FA", "#34D399", "#F59E0B", "#F97316", "#A78BFA", "#94A3B8"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [activeTab, setActiveTab] = useState("markets");
  

  // Markets data
  const {
    pools: blendPools,
    loading: poolsLoading,
    error: poolsError,
    refetch: refetchPools
  } = useBlendPools();

  const {
    enhancedPools,
    loading: analyticsLoading,
    error: analyticsError
  } = useEnhancedPoolData(blendPools);

  const loading = poolsLoading || analyticsLoading;
  const error = poolsError?.message || analyticsError?.message || null;

  // Portfolio calculations
  const totalSupplied = mockUserPositions.reduce((acc, pos) => 
    acc + parseFloat(pos.supplied.replace(/[$M,K]/g, '')), 0
  );
  const totalBorrowed = mockUserPositions.reduce((acc, pos) => 
    acc + parseFloat(pos.borrowed.replace(/[$M,K]/g, '')), 0
  );
  const avgHealthFactor = mockUserPositions.reduce((acc, pos) => 
    acc + parseFloat(pos.healthFactor), 0
  ) / mockUserPositions.length;
  const netApy = "3.78%";

  // Market stats from enhanced pools
  const marketStats = enhancedPools.length > 0 ? {
    totalValueLocked: `$${(enhancedPools.reduce((sum, pool) => sum + pool.tvl, 0) / 1e6).toFixed(1)}M`,
    totalMarkets: enhancedPools.length,
    avgUtilization: `${(enhancedPools.reduce((sum, pool) => sum + pool.utilizationRate, 0) / enhancedPools.length * 100).toFixed(1)}%`,
    totalUsers: enhancedPools.reduce((sum, pool) => sum + pool.activeUsers, 0)
  } : {
    totalValueLocked: "$0.0M",
    totalMarkets: 0,
    avgUtilization: "0.0%",
    totalUsers: 0
  };

  // Navigation handlers
  const handleViewPoolDetails = (poolAddress: string) => {
    navigate(`/pool/${poolAddress}`);
  };

  const handleSupply = (poolAddress: string) => {
    navigate(`/pool/${poolAddress}?action=supply`);
  };

  const handleBorrow = (poolAddress: string) => {
    navigate(`/pool/${poolAddress}?action=borrow`);
  };

  const handleRefresh = () => {
    refetchPools();
  };

  const getHealthFactorColor = (hf: string) => {
    const value = parseFloat(hf);
    if (value >= 2.0) return "text-emerald-400";
    if (value >= 1.5) return "text-amber-400";
    return "text-red-400";
  };

  const getHealthFactorStatus = (hf: string) => {
    const value = parseFloat(hf);
    if (value >= 2.0) return "Healthy";
    if (value >= 1.5) return "Moderate";
    return "At Risk";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Header with Create SRWA Button */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <motion.h1 
              className="text-3xl md:text-4xl font-bold text-fg-primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Dashboard
            </motion.h1>
            <motion.p 
              className="text-lg text-fg-secondary mt-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Markets, Portfolio & Administration unified
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="btn-primary px-6 py-3 text-body-1 relative overflow-hidden group"
              onClick={() => window.location.href = '/kyc'}
            >
              <span className="relative z-10">Create SRWA</span>
              <Plus className="ml-2 h-5 w-5 relative z-10 group-hover:rotate-90 transition-transform" />
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

        {/* Global Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, staggerChildren: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Total Value Locked"
              value={loading ? "Loading..." : marketStats.totalValueLocked}
              icon={DollarSign}
              trend="up"
              trendValue="Live"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Your Portfolio"
              value={`$${totalSupplied.toFixed(1)}M`}
              icon={Shield}
              trend="up"
              trendValue="+5.2%"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Active Markets"
              value={loading ? "-" : marketStats.totalMarkets.toString()}
              icon={BarChart3}
              subtitle="Live protocols"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <KPICard
              title="Net APY"
              value={netApy}
              icon={TrendingUp}
              trend="up"
              trendValue="+0.15%"
            />
          </motion.div>
        </motion.div>

        {/* Main Tabs Interface */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-12 bg-card/50 backdrop-blur-sm border border-brand-500/20">
                <TabsTrigger 
                  value="markets" 
                  className="data-[state=active]:bg-brand-500/20 data-[state=active]:text-brand-300 transition-all duration-300"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Markets
                </TabsTrigger>
                <TabsTrigger 
                  value="portfolio" 
                  className="data-[state=active]:bg-brand-500/20 data-[state=active]:text-brand-300 transition-all duration-300"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="data-[state=active]:bg-brand-500/20 data-[state=active]:text-brand-300 transition-all duration-300"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Markets Tab */}
            <TabsContent value="markets" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <motion.h2 
                    className="text-3xl font-bold text-fg-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Lending Markets
                    <motion.span 
                      className="inline-block ml-2"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Zap className="h-6 w-6 text-brand-400 inline" />
                    </motion.span>
                  </motion.h2>
                  <motion.p 
                    className="text-lg text-fg-secondary max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Discover and interact with Blend Protocol lending pools on Stellar.
                  </motion.p>
                </div>

                <MarketsDashboard
                  pools={enhancedPools}
                  loading={loading}
                  error={error}
                  onRefresh={handleRefresh}
                  onViewPoolDetails={handleViewPoolDetails}
                  onSupply={handleSupply}
                  onBorrow={handleBorrow}
                />
              </motion.div>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <motion.h2 
                    className="text-3xl font-bold text-fg-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Portfolio Management
                    <motion.span 
                      className="inline-block ml-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Shield className="h-6 w-6 text-brand-400 inline" />
                    </motion.span>
                  </motion.h2>
                  <motion.p 
                    className="text-lg text-fg-secondary max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Monitor your RWA lending positions, health factors, and performance metrics.
                  </motion.p>
                </div>

                {/* Portfolio Overview KPIs */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, staggerChildren: 0.1 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <KPICard
                      title="Total Supplied"
                      value={`$${totalSupplied.toFixed(1)}M`}
                      icon={DollarSign}
                      trend="up"
                      trendValue="+5.2%"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <KPICard
                      title="Total Borrowed"
                      value={`$${totalBorrowed.toFixed(1)}M`}
                      icon={TrendingUp}
                      subtitle="Active positions"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <KPICard
                      title="Net APY"
                      value={netApy}
                      icon={BarChart3}
                      trend="up"
                      trendValue="+0.15%"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <KPICard
                      title="Avg Health Factor"
                      value={avgHealthFactor.toFixed(2)}
                      icon={Shield}
                      trend="neutral"
                      trendValue="Stable"
                    />
                  </motion.div>
                </motion.div>

                {/* Portfolio Tabs */}
                <Tabs defaultValue="positions" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 lg:w-96">
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>

                  {/* Positions Tab */}
                  <TabsContent value="positions" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {mockUserPositions.map((position, index) => (
                        <motion.div
                          key={position.marketId}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          whileHover={{ y: -8, scale: 1.02 }}
                        >
                          <Card className="card-institutional hover-lift">
                            <div className="space-y-6">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <h3 className="text-h3 font-semibold text-fg-primary">
                                    {position.marketName}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={getHealthFactorColor(position.healthFactor)}
                                    >
                                      HF: {position.healthFactor}
                                    </Badge>
                                    <span className="text-micro text-fg-muted">
                                      {getHealthFactorStatus(position.healthFactor)}
                                    </span>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedPosition(position)}
                                >
                                  <Activity className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Position Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-micro text-fg-muted uppercase tracking-wide">Supplied</p>
                                    <p className="text-body-1 font-semibold text-fg-primary tabular-nums">
                                      {position.supplied}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-micro text-fg-muted uppercase tracking-wide">Collateral Value</p>
                                    <p className="text-body-2 text-fg-secondary tabular-nums">
                                      {position.collateralValue}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-micro text-fg-muted uppercase tracking-wide">Borrowed</p>
                                    <p className="text-body-1 font-semibold text-fg-primary tabular-nums">
                                      {position.borrowed}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-micro text-fg-muted uppercase tracking-wide">Net APY</p>
                                    <p className="text-body-2 text-brand-400 font-medium tabular-nums">
                                      {position.netApy}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Health Factor Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-micro text-fg-muted">Health Factor</span>
                                  <span className={`text-micro font-medium ${getHealthFactorColor(position.healthFactor)}`}>
                                    {position.healthFactor}
                                  </span>
                                </div>
                                <div className="w-full bg-bg-elev-2 rounded-full h-2">
                                  <motion.div 
                                    className={`h-2 rounded-full ${
                                      parseFloat(position.healthFactor) >= 2.0 ? 'bg-emerald-400' :
                                      parseFloat(position.healthFactor) >= 1.5 ? 'bg-amber-400' : 'bg-red-400'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((parseFloat(position.healthFactor) / 3) * 100, 100)}%` }}
                                    transition={{ duration: 1.5, delay: index * 0.2 }}
                                  />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-3">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Supply
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Minus className="h-4 w-4 mr-2" />
                                  Withdraw
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Risk Alerts */}
                    <Card className="card-institutional">
                      <div className="flex items-start space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-h3 font-semibold text-fg-primary">Risk Management</h3>
                          <p className="text-body-2 text-fg-secondary">
                            Monitor health factors closely. Consider adding collateral or reducing borrowed amounts 
                            when health factor approaches 1.5.
                          </p>
                          <Button variant="outline" size="sm">
                            View Risk Guidelines
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="space-y-6">
                    <Card className="card-institutional">
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-fg-muted mx-auto mb-4" />
                        <h3 className="text-h3 text-fg-primary mb-2">Transaction History</h3>
                        <p className="text-body-2 text-fg-muted mb-6">
                          Your transaction history will appear here as you interact with markets.
                        </p>
                        <Button variant="outline">
                          View All Transactions
                        </Button>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="card-institutional">
                        <div className="space-y-4">
                          <h3 className="text-h3 font-semibold text-fg-primary">Performance Overview</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-body-2 text-fg-secondary">Total Returns (30d)</span>
                              <span className="text-body-2 font-semibold text-emerald-400">+$24,580</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-body-2 text-fg-secondary">Interest Earned</span>
                              <span className="text-body-2 font-semibold text-fg-primary">$18,950</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-body-2 text-fg-secondary">Interest Paid</span>
                              <span className="text-body-2 font-semibold text-fg-primary">$5,630</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="card-institutional">
                        <div className="space-y-4">
                          <h3 className="text-h3 font-semibold text-fg-primary">Risk Metrics</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-body-2 text-fg-secondary">Portfolio Health</span>
                              <span className="text-body-2 font-semibold text-emerald-400">Healthy</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-body-2 text-fg-secondary">Liquidation Risk</span>
                              <span className="text-body-2 font-semibold text-fg-primary">Low</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-body-2 text-fg-secondary">Diversification Score</span>
                              <span className="text-body-2 font-semibold text-brand-400">8.5/10</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <motion.h2 
                    className="text-3xl font-bold text-fg-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    RWA Dashboard
                    <motion.span 
                      className="inline-block ml-2"
                      animate={{ rotateY: [0, 180, 0] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Lock className="h-6 w-6 text-brand-400 inline" />
                    </motion.span>
                  </motion.h2>
                  <motion.p 
                    className="text-lg text-fg-secondary max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Tokenized Treasuries overview and market metrics for administrators.
                  </motion.p>
                </div>

                {/* Admin Quick Stats */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-4 gap-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, staggerChildren: 0.1 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="p-6 card-institutional hover-lift">
                      <div className="space-y-1">
                        <p className="text-micro text-fg-muted uppercase">Total Value</p>
                        <div className="flex items-center gap-2">
                          <p className="text-h3 font-semibold text-fg-primary">$7.49B</p>
                          <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">+0.58%</Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="p-6 card-institutional hover-lift">
                      <div className="space-y-1">
                        <p className="text-micro text-fg-muted uppercase">Avg. Yield to Maturity</p>
                        <p className="text-h3 font-semibold text-fg-primary">4.12%</p>
                      </div>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="p-6 card-institutional hover-lift">
                      <div className="space-y-1">
                        <p className="text-micro text-fg-muted uppercase">Total Assets</p>
                        <p className="text-h3 font-semibold text-fg-primary">49</p>
                      </div>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="p-6 card-institutional hover-lift">
                      <div className="space-y-1">
                        <p className="text-micro text-fg-muted uppercase">Holders</p>
                        <div className="flex items-center gap-2">
                          <p className="text-h3 font-semibold text-fg-primary">53,049</p>
                          <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">+0.26%</Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Admin Charts */}
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="lg:col-span-2"
                  >
                    <Card className="p-6 card-institutional hover-lift">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-h3 font-medium text-fg-primary">Total RWA Value</h3>
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={lineData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                            <defs>
                              <linearGradient id="areaFillAdmin" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} domain={[0, "dataMax+0.5"]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} fill="url(#areaFillAdmin)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                  >
                    <Card className="p-4 card-institutional hover-lift">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-h3 font-medium text-fg-primary">Market Caps</h3>
                      </div>
                      <div className="h-80 w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={pieData} 
                              dataKey="value" 
                              nameKey="name" 
                              innerRadius={40} 
                              outerRadius={80} 
                              paddingAngle={2}
                              cx="50%" 
                              cy="40%"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              wrapperStyle={{
                                fontSize: '12px',
                                lineHeight: '14px',
                                paddingTop: '10px'
                              }}
                            />
                            <Tooltip 
                              formatter={(value: any) => [`$${(value/1000).toFixed(1)}B`, 'Value']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
