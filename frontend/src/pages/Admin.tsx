import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, Users, AlertTriangle, Pause, Play, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Admin() {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState("");

  const markets = [
    { id: "t-bills-1", name: "US Treasury Bills 3M", status: "active", lltv: "95%", premium: "0.5%" },
    { id: "credit-1", name: "Corporate Credit Fund", status: "active", lltv: "80%", premium: "2.1%" },
    { id: "re-1", name: "Commercial Real Estate", status: "paused", lltv: "75%", premium: "3.2%" },
  ];

  const users = [
    { id: "1", address: "GABC123...DEF789", status: "approved", region: "US", lastActive: "2024-01-15" },
    { id: "2", address: "GDEF456...GHI012", status: "pending", region: "UK", lastActive: "2024-01-14" },
    { id: "3", address: "GHIJ789...KLM345", status: "approved", region: "SG", lastActive: "2024-01-13" },
  ];

  const handleMarketPause = (marketId: string) => {
    toast({
      title: "Market Updated",
      description: `Market ${marketId} has been paused`,
    });
  };

  const handleUserStatusChange = (userId: string, newStatus: string) => {
    toast({
      title: "User Status Updated",
      description: `User ${userId} status changed to ${newStatus}`,
    });
  };

  const handleEmergencyPause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "System Resumed" : "Emergency Pause Activated",
      description: isPaused ? "All markets are now active" : "All markets have been paused",
      variant: isPaused ? "default" : "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-h1 font-semibold text-fg-primary">Admin Dashboard</h1>
            <p className="text-body-1 text-fg-secondary">
              Manage risk parameters, user permissions, and system controls.
            </p>
          </div>
          
          <Card className="bg-bg-elev-1 border-stroke-line p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                ) : (
                  <Shield className="h-5 w-5 text-green-400" />
                )}
                <span className="text-body-2 font-medium text-fg-primary">
                  System Status: {isPaused ? "Paused" : "Active"}
                </span>
              </div>
              <Button
                onClick={handleEmergencyPause}
                variant={isPaused ? "default" : "destructive"}
                size="sm"
              >
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? "Resume" : "Emergency Pause"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
          <Card className="card-institutional">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-brand-400" />
              <div>
                <p className="text-micro text-fg-muted uppercase tracking-wide">Active Markets</p>
                <p className="text-h3 font-semibold text-fg-primary">3</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-institutional">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-brand-400" />
              <div>
                <p className="text-micro text-fg-muted uppercase tracking-wide">Verified Users</p>
                <p className="text-h3 font-semibold text-fg-primary">127</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-institutional">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-brand-400" />
              <div>
                <p className="text-micro text-fg-muted uppercase tracking-wide">Risk Alerts</p>
                <p className="text-h3 font-semibold text-fg-primary">0</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-institutional">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-brand-400" />
              <div>
                <p className="text-micro text-fg-muted uppercase tracking-wide">Pending Reviews</p>
                <p className="text-h3 font-semibold text-fg-primary">5</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="card-institutional animate-fade-in">
          <Tabs defaultValue="markets" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="risk">Risk Parameters</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="markets" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-medium text-fg-primary">Market Management</h3>
                <Button className="btn-primary">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure New Market
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>LLTV</TableHead>
                    <TableHead>Risk Premium</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {markets.map((market) => (
                    <TableRow key={market.id}>
                      <TableCell className="font-medium">{market.name}</TableCell>
                      <TableCell>
                        <Badge variant={market.status === "active" ? "default" : "secondary"}>
                          {market.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{market.lltv}</TableCell>
                      <TableCell className="tabular-nums">{market.premium}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarketPause(market.id)}
                          >
                            {market.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-medium text-fg-primary">User Management</h3>
                <div className="flex gap-3">
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-micro">{user.address}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "approved" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.region}</TableCell>
                      <TableCell>{user.lastActive}</TableCell>
                      <TableCell>
                        <Select onValueChange={(value) => handleUserStatusChange(user.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approve</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                            <SelectItem value="suspended">Suspend</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <h3 className="text-h3 font-medium text-fg-primary">Risk Parameter Configuration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-bg-elev-2 border-stroke-line p-6">
                  <h4 className="text-body-1 font-medium text-fg-primary mb-4">Global Settings</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="base-rate">Base Interest Rate (%)</Label>
                      <Input id="base-rate" defaultValue="3.5" className="input-institutional" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-utilization">Max Utilization (%)</Label>
                      <Input id="max-utilization" defaultValue="90" className="input-institutional" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liquidation-threshold">Liquidation Threshold (%)</Label>
                      <Input id="liquidation-threshold" defaultValue="85" className="input-institutional" />
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-bg-elev-2 border-stroke-line p-6">
                  <h4 className="text-body-1 font-medium text-fg-primary mb-4">Asset-Specific Premiums</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="treasury-premium">Treasury Bills Premium (%)</Label>
                      <Input id="treasury-premium" defaultValue="0.5" className="input-institutional" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit-premium">Corporate Credit Premium (%)</Label>
                      <Input id="credit-premium" defaultValue="2.1" className="input-institutional" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="re-premium">Real Estate Premium (%)</Label>
                      <Input id="re-premium" defaultValue="3.2" className="input-institutional" />
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Button className="btn-primary">Save Risk Parameters</Button>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <h3 className="text-h3 font-medium text-fg-primary">System Configuration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-bg-elev-2 border-stroke-line p-6">
                  <h4 className="text-body-1 font-medium text-fg-primary mb-4">Circuit Breakers</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-2 text-fg-primary">Auto-pause on high volatility</p>
                        <p className="text-micro text-fg-muted">Automatically pause markets during extreme price movements</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-2 text-fg-primary">Liquidation protection</p>
                        <p className="text-micro text-fg-muted">Prevent mass liquidations during market stress</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-2 text-fg-primary">Oracle staleness protection</p>
                        <p className="text-micro text-fg-muted">Pause trading when oracle prices are stale</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-bg-elev-2 border-stroke-line p-6">
                  <h4 className="text-body-1 font-medium text-fg-primary mb-4">Monitoring</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-2 text-fg-primary">Real-time alerts</p>
                        <p className="text-micro text-fg-muted">Send notifications for critical events</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-2 text-fg-primary">Audit logging</p>
                        <p className="text-micro text-fg-muted">Log all administrative actions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-2 text-fg-primary">Performance monitoring</p>
                        <p className="text-micro text-fg-muted">Track system performance metrics</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}