import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  ChevronRight,
  Clock,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
}

interface PredictionResult {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  predictedWinner: string | null;
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  confidence: number;
  valueRating: string;
  rationale: string;
  valueBets: Array<{
    selection: string;
    betType: string;
    bookmaker: string;
    odds: number;
    expectedValue: number;
    valueRating: string;
  }>;
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getValueBadgeColor(rating: string): string {
  switch (rating) {
    case "strong_value":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "moderate_value":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "fair_value":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
}

function EventCard({ 
  event, 
  prediction,
  onPlaceBet 
}: { 
  event: Event; 
  prediction?: PredictionResult;
  onPlaceBet: (event: Event, selection: string, odds: number, betType: string) => void;
}) {
  const h2hMarket = event.bookmakers?.[0]?.markets?.find(m => m.key === "h2h");
  const spreadsMarket = event.bookmakers?.[0]?.markets?.find(m => m.key === "spreads");
  const totalsMarket = event.bookmakers?.[0]?.markets?.find(m => m.key === "totals");

  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {event.home_team} vs {event.away_team}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              {formatDate(event.commence_time)}
            </CardDescription>
          </div>
          {prediction && (
            <Badge className={getValueBadgeColor(prediction.valueRating)}>
              {prediction.valueRating.replace("_", " ")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prediction Summary */}
        {prediction && (
          <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-primary" />
              AI Prediction
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Home</p>
                <p className="font-bold">{(prediction.homeWinProbability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Draw</p>
                <p className="font-bold">{(prediction.drawProbability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Away</p>
                <p className="font-bold">{(prediction.awayWinProbability * 100).toFixed(0)}%</p>
              </div>
            </div>
            {prediction.valueBets.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Value Bets:</p>
                {prediction.valueBets.slice(0, 2).map((vb, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{vb.selection}</span>
                    <span className="text-green-400">+{vb.expectedValue}% EV</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Betting Options */}
        <Tabs defaultValue="moneyline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="moneyline">Moneyline</TabsTrigger>
            <TabsTrigger value="spread">Spread</TabsTrigger>
            <TabsTrigger value="total">Total</TabsTrigger>
          </TabsList>
          
          <TabsContent value="moneyline" className="mt-3">
            {h2hMarket ? (
              <div className="grid grid-cols-2 gap-2">
                {h2hMarket.outcomes.map((outcome) => (
                  <Button
                    key={outcome.name}
                    variant="outline"
                    className="flex flex-col h-auto py-3 hover:bg-primary/10 hover:border-primary"
                    onClick={() => onPlaceBet(event, outcome.name, outcome.price, "moneyline")}
                  >
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {outcome.name}
                    </span>
                    <span className={`text-lg font-bold ${outcome.price > 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatOdds(outcome.price)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No moneyline odds available
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="spread" className="mt-3">
            {spreadsMarket ? (
              <div className="grid grid-cols-2 gap-2">
                {spreadsMarket.outcomes.map((outcome) => (
                  <Button
                    key={outcome.name}
                    variant="outline"
                    className="flex flex-col h-auto py-3 hover:bg-primary/10 hover:border-primary"
                    onClick={() => onPlaceBet(event, `${outcome.name} ${outcome.point! > 0 ? "+" : ""}${outcome.point}`, outcome.price, "spread")}
                  >
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {outcome.name} ({outcome.point! > 0 ? "+" : ""}{outcome.point})
                    </span>
                    <span className={`text-lg font-bold ${outcome.price > 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatOdds(outcome.price)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No spread odds available
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="total" className="mt-3">
            {totalsMarket ? (
              <div className="grid grid-cols-2 gap-2">
                {totalsMarket.outcomes.map((outcome) => (
                  <Button
                    key={outcome.name}
                    variant="outline"
                    className="flex flex-col h-auto py-3 hover:bg-primary/10 hover:border-primary"
                    onClick={() => onPlaceBet(event, `${outcome.name} ${outcome.point}`, outcome.price, "total")}
                  >
                    <span className="text-xs text-muted-foreground">
                      {outcome.name} {outcome.point}
                    </span>
                    <span className={`text-lg font-bold ${outcome.price > 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatOdds(outcome.price)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No total odds available
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function Events() {
  const params = useParams<{ sportKey?: string }>();
  const [selectedSport, setSelectedSport] = useState(params.sportKey || "basketball_nba");
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<{
    event: Event;
    selection: string;
    odds: number;
    betType: string;
  } | null>(null);
  const [stake, setStake] = useState("10");

  const { data: sports, isLoading: sportsLoading } = trpc.sports.list.useQuery();
  const { data: events, isLoading: eventsLoading } = trpc.sports.getOdds.useQuery(
    { sportKey: selectedSport },
    { enabled: !!selectedSport }
  );
  const { data: predictions, isLoading: predictionsLoading } = trpc.predictions.generate.useQuery(
    { sportKey: selectedSport },
    { enabled: !!selectedSport }
  );
  const { data: wallet } = trpc.wallet.get.useQuery();

  const placeBetMutation = trpc.bets.place.useMutation({
    onSuccess: () => {
      toast.success("Bet placed successfully!");
      setBetDialogOpen(false);
      setSelectedBet(null);
      setStake("10");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const predictionsMap = useMemo(() => {
    if (!predictions || !Array.isArray(predictions)) return {};
    return predictions.reduce((acc, pred) => {
      acc[pred.eventId] = pred;
      return acc;
    }, {} as Record<string, PredictionResult>);
  }, [predictions]);

  const handlePlaceBet = (event: Event, selection: string, odds: number, betType: string) => {
    setSelectedBet({ event, selection, odds, betType });
    setBetDialogOpen(true);
  };

  const confirmBet = () => {
    if (!selectedBet) return;
    
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    placeBetMutation.mutate({
      eventId: selectedBet.event.id,
      sportKey: selectedBet.event.sport_key,
      homeTeam: selectedBet.event.home_team,
      awayTeam: selectedBet.event.away_team,
      commenceTime: selectedBet.event.commence_time,
      betType: selectedBet.betType as "moneyline" | "spread" | "total",
      selection: selectedBet.selection,
      odds: selectedBet.odds,
      stake: stakeNum,
    });
  };

  const calculatePayout = () => {
    const stakeNum = parseFloat(stake) || 0;
    if (!selectedBet || stakeNum <= 0) return 0;
    
    if (selectedBet.odds > 0) {
      return stakeNum + (stakeNum * selectedBet.odds / 100);
    } else {
      return stakeNum + (stakeNum * 100 / Math.abs(selectedBet.odds));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              <strong>Paper Trading Mode:</strong> All bets use virtual money. This is for educational purposes only.
            </p>
          </div>
        </div>

        {/* Sport Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Sport</CardTitle>
            <CardDescription>Choose a sport to view upcoming events and odds</CardDescription>
          </CardHeader>
          <CardContent>
            {sportsLoading ? (
              <div className="flex gap-2 flex-wrap">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {sports?.slice(0, 10).map((sport) => (
                  <Button
                    key={sport.key}
                    variant={selectedSport === sport.key ? "default" : "outline"}
                    onClick={() => setSelectedSport(sport.key)}
                    className="text-sm"
                  >
                    {sport.title}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Upcoming Events
            {predictionsLoading && <span className="text-sm font-normal text-muted-foreground ml-2">Loading predictions...</span>}
          </h2>
          
          {eventsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  prediction={predictionsMap[event.id]}
                  onPlaceBet={handlePlaceBet}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming events for this sport.</p>
                <p className="text-sm text-muted-foreground mt-1">Try selecting a different sport.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bet Placement Dialog */}
        <Dialog open={betDialogOpen} onOpenChange={setBetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Place Bet</DialogTitle>
              <DialogDescription>
                Confirm your bet details below. Remember: this uses virtual money only.
              </DialogDescription>
            </DialogHeader>
            
            {selectedBet && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Match</p>
                  <p className="font-medium">{selectedBet.event.home_team} vs {selectedBet.event.away_team}</p>
                  
                  <p className="text-sm text-muted-foreground mt-3">Selection</p>
                  <p className="font-medium">{selectedBet.selection}</p>
                  
                  <p className="text-sm text-muted-foreground mt-3">Odds</p>
                  <p className={`font-bold text-lg ${selectedBet.odds > 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatOdds(selectedBet.odds)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stake">Stake Amount ($)</Label>
                  <Input
                    id="stake"
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    min="1"
                    max={wallet?.balance ? parseFloat(wallet.balance) : 10000}
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: ${wallet?.balance || "0.00"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Potential Payout</span>
                    <span className="text-xl font-bold text-primary">
                      ${calculatePayout().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setBetDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmBet} 
                disabled={placeBetMutation.isPending}
              >
                {placeBetMutation.isPending ? "Placing..." : "Place Bet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
