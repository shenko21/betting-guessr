import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Percent,
  Trophy,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// Chart configurations
const profitChartConfig: ChartConfig = {
  cumulative: {
    label: "Total P/L",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "Daily P/L",
    color: "hsl(var(--chart-2))",
  },
};

const sportChartConfig: ChartConfig = {
  wins: {
    label: "Wins",
    color: "hsl(142.1 76.2% 36.3%)",
  },
  losses: {
    label: "Losses",
    color: "hsl(346.8 77.2% 49.8%)",
  },
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: wallet, isLoading: walletLoading } = trpc.wallet.get.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: stats, isLoading: statsLoading } = trpc.bets.stats.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: pendingBets, isLoading: pendingLoading } = trpc.bets.pending.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: recentBets, isLoading: recentLoading } = trpc.bets.list.useQuery({ limit: 5 }, {
    enabled: !!user,
  });
  const { data: profitHistory, isLoading: profitLoading } = trpc.bets.profitHistory.useQuery(
    { days: 30 },
    { enabled: !!user }
  );
  const { data: sportStats, isLoading: sportStatsLoading } = trpc.bets.statsBySport.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Auto-settle mutation
  const autoSettleMutation = trpc.bets.autoSettle.useMutation({
    onSuccess: () => {
      utils.bets.pending.invalidate();
      utils.bets.list.invalidate();
      utils.bets.stats.invalidate();
      utils.bets.profitHistory.invalidate();
      utils.wallet.get.invalidate();
    },
  });

  const isLoading = authLoading || walletLoading || statsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Responsible Gambling Warning */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Responsible Gambling Reminder</p>
            <p className="text-sm text-muted-foreground mt-1">
              This platform uses virtual money for educational purposes only. Never bet more than you can afford to lose.{" "}
              <Link href="/responsible-gambling" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Virtual Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(wallet?.balance || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paper trading balance
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {stats?.winRate.toFixed(1) || 0}%
                    {stats && stats.winRate >= 52.4 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.wonBets || 0}W - {stats?.lostBets || 0}L
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${(stats?.profitLoss || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(stats?.profitLoss || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ROI: {formatPercent(stats?.roi || 0)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalBets || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingBets || 0} pending
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profit Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Profit Over Time
              </CardTitle>
              <CardDescription>Last 30 days performance</CardDescription>
            </CardHeader>
            <CardContent>
              {profitLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : profitHistory && profitHistory.length > 0 ? (
                <ChartContainer config={profitChartConfig} className="h-[200px] w-full">
                  <AreaChart data={profitHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span className={Number(value) >= 0 ? "text-green-500" : "text-red-500"}>
                              {formatCurrency(Number(value))}
                            </span>
                          )}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#profitGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  <p>No betting data yet. Place some bets to see your performance!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance by Sport Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Performance by Sport
              </CardTitle>
              <CardDescription>Win/loss breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {sportStatsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : sportStats && sportStats.length > 0 ? (
                <ChartContainer config={sportChartConfig} className="h-[200px] w-full">
                  <BarChart data={sportStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="sport"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span>{value} {name}</span>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="wins" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" fill="hsl(346.8 77.2% 49.8%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  <p>No sport data yet. Place bets on different sports!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Find Value Bets
              </CardTitle>
              <CardDescription>
                AI-powered analysis to identify betting opportunities with positive expected value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/events">
                <Button className="w-full">
                  Browse Events <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Build Parlay
              </CardTitle>
              <CardDescription>
                Combine multiple selections into a parlay bet with calculated combined odds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/parlay">
                <Button variant="secondary" className="w-full">
                  Parlay Builder <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                AI Advisor
              </CardTitle>
              <CardDescription>
                Get personalized betting advice and analysis from our AI assistant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/advisor">
                <Button variant="outline" className="w-full">
                  Ask Advisor <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pending Bets */}
        {pendingBets && pendingBets.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Bets</CardTitle>
                <CardDescription>Your active bets awaiting results</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoSettleMutation.mutate()}
                disabled={autoSettleMutation.isPending}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${autoSettleMutation.isPending ? "animate-spin" : ""}`} />
                {autoSettleMutation.isPending ? "Settling..." : "Auto-Settle"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingBets.slice(0, 5).map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{bet.selection}</p>
                      <p className="text-sm text-muted-foreground">
                        {bet.homeTeam} vs {bet.awayTeam}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {parseFloat(bet.odds) > 0 ? "+" : ""}{bet.odds}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stake: {formatCurrency(bet.stake)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {pendingBets.length > 5 && (
                <Link href="/history">
                  <Button variant="ghost" className="w-full mt-4">
                    View All Pending Bets
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest betting activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentBets && recentBets.length > 0 ? (
              <div className="space-y-3">
                {recentBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          bet.status === "won"
                            ? "default"
                            : bet.status === "lost"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {bet.status}
                      </Badge>
                      <div>
                        <p className="font-medium">{bet.selection}</p>
                        <p className="text-sm text-muted-foreground">
                          {bet.homeTeam} vs {bet.awayTeam}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${bet.status === "won" ? "text-green-500" : bet.status === "lost" ? "text-red-500" : ""}`}>
                        {bet.status === "won"
                          ? `+${formatCurrency(parseFloat(bet.potentialPayout) - parseFloat(bet.stake))}`
                          : bet.status === "lost"
                          ? `-${formatCurrency(bet.stake)}`
                          : formatCurrency(bet.stake)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(bet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No betting activity yet.</p>
                <Link href="/events">
                  <Button variant="link" className="mt-2">
                    Start exploring events
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
