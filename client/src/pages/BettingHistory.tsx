import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  History, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertTriangle
} from "lucide-react";

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatOdds(odds: number | string): string {
  const num = typeof odds === "string" ? parseFloat(odds) : odds;
  return num > 0 ? `+${num}` : `${num}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case "won":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "lost":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "push":
      return <MinusCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "won":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Won</Badge>;
    case "lost":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Lost</Badge>;
    case "push":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Push</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Pending</Badge>;
  }
}

export default function BettingHistory() {
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [settleStatus, setSettleStatus] = useState<"won" | "lost" | "push">("won");

  const { data: bets, isLoading: betsLoading, refetch: refetchBets } = trpc.bets.list.useQuery({ limit: 100 });
  const { data: parlays, isLoading: parlaysLoading, refetch: refetchParlays } = trpc.parlays.list.useQuery({ limit: 50 });
  const { data: stats, isLoading: statsLoading } = trpc.bets.stats.useQuery();
  const { data: transactions, isLoading: transactionsLoading } = trpc.wallet.getTransactions.useQuery({ limit: 50 });

  const settleBetMutation = trpc.bets.settle.useMutation({
    onSuccess: () => {
      toast.success("Bet settled successfully!");
      setSettleDialogOpen(false);
      setSelectedBet(null);
      refetchBets();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const pendingBets = bets?.filter(b => b.status === "pending") || [];
  const settledBets = bets?.filter(b => b.status !== "pending") || [];

  const openSettleDialog = (bet: any) => {
    setSelectedBet(bet);
    setSettleStatus("won");
    setSettleDialogOpen(true);
  };

  const confirmSettle = () => {
    if (!selectedBet) return;
    settleBetMutation.mutate({
      betId: selectedBet.id,
      status: settleStatus,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold">{stats?.totalBets || 0}</p>
                </div>
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{stats?.winRate.toFixed(1) || 0}%</p>
                </div>
                {stats && stats.winRate >= 52.4 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalStaked || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${(stats?.profitLoss || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(stats?.profitLoss || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Betting History Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingBets.length})
            </TabsTrigger>
            <TabsTrigger value="settled" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Settled ({settledBets.length})
            </TabsTrigger>
            <TabsTrigger value="parlays" className="flex items-center gap-2">
              Parlays ({parlays?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Pending Bets */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Bets</CardTitle>
                <CardDescription>
                  Bets awaiting results. For demo purposes, you can manually settle these bets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {betsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : pendingBets.length > 0 ? (
                  <div className="space-y-3">
                    {pendingBets.map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(bet.status)}
                          <div>
                            <p className="font-medium">{bet.selection}</p>
                            <p className="text-sm text-muted-foreground">
                              {bet.homeTeam} vs {bet.awayTeam}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(bet.commenceTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold ${parseFloat(bet.odds) > 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatOdds(bet.odds)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Stake: {formatCurrency(bet.stake)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              To win: {formatCurrency(parseFloat(bet.potentialPayout) - parseFloat(bet.stake))}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSettleDialog(bet)}
                          >
                            Settle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending bets</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settled Bets */}
          <TabsContent value="settled">
            <Card>
              <CardHeader>
                <CardTitle>Settled Bets</CardTitle>
                <CardDescription>Your completed betting history</CardDescription>
              </CardHeader>
              <CardContent>
                {betsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : settledBets.length > 0 ? (
                  <div className="space-y-3">
                    {settledBets.map((bet) => (
                      <div
                        key={bet.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(bet.status)}
                          <div>
                            <p className="font-medium">{bet.selection}</p>
                            <p className="text-sm text-muted-foreground">
                              {bet.homeTeam} vs {bet.awayTeam}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(bet.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold ${parseFloat(bet.odds) > 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatOdds(bet.odds)}
                            </p>
                            <p className={`text-sm font-medium ${
                              bet.status === "won" ? "text-green-500" : 
                              bet.status === "lost" ? "text-red-500" : ""
                            }`}>
                              {bet.status === "won" 
                                ? `+${formatCurrency(parseFloat(bet.potentialPayout) - parseFloat(bet.stake))}`
                                : bet.status === "lost"
                                ? `-${formatCurrency(bet.stake)}`
                                : formatCurrency(bet.stake)}
                            </p>
                          </div>
                          {getStatusBadge(bet.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No settled bets yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parlays */}
          <TabsContent value="parlays">
            <Card>
              <CardHeader>
                <CardTitle>Parlay History</CardTitle>
                <CardDescription>Your multi-leg parlay bets</CardDescription>
              </CardHeader>
              <CardContent>
                {parlaysLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : parlays && parlays.length > 0 ? (
                  <div className="space-y-4">
                    {parlays.map((parlay) => (
                      <Card key={parlay.id} className="bg-secondary/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium">{parlay.legs.length}-Leg Parlay</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(parlay.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(parlay.status)}
                              <p className={`font-bold mt-1 ${parseFloat(parlay.combinedOdds) > 0 ? "text-green-400" : "text-red-400"}`}>
                                {formatOdds(parlay.combinedOdds)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            {parlay.legs.map((leg, i) => (
                              <div key={leg.id} className="flex items-center justify-between text-sm p-2 rounded bg-background/50">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(leg.status)}
                                  <span>{leg.selection}</span>
                                </div>
                                <span className={parseFloat(leg.odds) > 0 ? "text-green-400" : "text-red-400"}>
                                  {formatOdds(leg.odds)}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between text-sm pt-3 border-t">
                            <span>Stake: {formatCurrency(parlay.stake)}</span>
                            <span>Potential: {formatCurrency(parlay.potentialPayout)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No parlays yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All wallet transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div>
                          <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                          <p className="text-sm text-muted-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${parseFloat(tx.amount) >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {parseFloat(tx.amount) >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {formatCurrency(tx.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Settle Bet Dialog */}
        <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settle Bet</DialogTitle>
              <DialogDescription>
                For demo purposes, manually settle this bet to see how your balance changes.
              </DialogDescription>
            </DialogHeader>
            
            {selectedBet && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="font-medium">{selectedBet.selection}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBet.homeTeam} vs {selectedBet.awayTeam}
                  </p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>Stake: {formatCurrency(selectedBet.stake)}</span>
                    <span>Odds: {formatOdds(selectedBet.odds)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Result</label>
                  <Select value={settleStatus} onValueChange={(v) => setSettleStatus(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="won">Won (+{formatCurrency(parseFloat(selectedBet.potentialPayout) - parseFloat(selectedBet.stake))})</SelectItem>
                      <SelectItem value="lost">Lost (-{formatCurrency(selectedBet.stake)})</SelectItem>
                      <SelectItem value="push">Push (Refund)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSettleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmSettle}
                disabled={settleBetMutation.isPending}
              >
                {settleBetMutation.isPending ? "Settling..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
