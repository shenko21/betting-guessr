import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Plus, 
  X, 
  AlertTriangle, 
  Calculator,
  Layers,
  DollarSign,
  Percent
} from "lucide-react";

interface ParlayLeg {
  eventId: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  betType: "moneyline" | "spread" | "total";
  selection: string;
  odds: number;
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ParlayBuilder() {
  const [selectedSport, setSelectedSport] = useState("basketball_nba");
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [stake, setStake] = useState("10");

  const { data: sports, isLoading: sportsLoading } = trpc.sports.list.useQuery();
  const { data: events, isLoading: eventsLoading } = trpc.sports.getOdds.useQuery(
    { sportKey: selectedSport },
    { enabled: !!selectedSport }
  );
  const { data: wallet } = trpc.wallet.get.useQuery();

  const { data: parlayCalc } = trpc.parlays.calculate.useQuery(
    { legs: parlayLegs.map(l => ({ odds: l.odds })) },
    { enabled: parlayLegs.length >= 2 }
  );

  const placeParlayMutation = trpc.parlays.place.useMutation({
    onSuccess: (data) => {
      toast.success(`Parlay placed! Potential payout: $${data.potentialPayout.toFixed(2)}`);
      setParlayLegs([]);
      setStake("10");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addLeg = (event: any, selection: string, odds: number, betType: "moneyline" | "spread" | "total") => {
    // Check if this event is already in the parlay
    if (parlayLegs.some(leg => leg.eventId === event.id)) {
      toast.error("This event is already in your parlay");
      return;
    }

    setParlayLegs([...parlayLegs, {
      eventId: event.id,
      sportKey: event.sportKey || event.sport_key,
      homeTeam: event.homeTeam || event.home_team,
      awayTeam: event.awayTeam || event.away_team,
      commenceTime: event.commenceTime || event.commence_time,
      betType,
      selection,
      odds,
    }]);
    
    toast.success("Added to parlay");
  };

  const removeLeg = (index: number) => {
    setParlayLegs(parlayLegs.filter((_, i) => i !== index));
  };

  const calculatePayout = () => {
    const stakeNum = parseFloat(stake) || 0;
    if (!parlayCalc || stakeNum <= 0) return 0;
    
    if (parlayCalc.combinedOdds > 0) {
      return stakeNum + (stakeNum * parlayCalc.combinedOdds / 100);
    } else {
      return stakeNum + (stakeNum * 100 / Math.abs(parlayCalc.combinedOdds));
    }
  };

  const placeParlay = () => {
    if (parlayLegs.length < 2) {
      toast.error("Parlay must have at least 2 legs");
      return;
    }

    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    placeParlayMutation.mutate({
      stake: stakeNum,
      legs: parlayLegs,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              <strong>Paper Trading Mode:</strong> Parlays use virtual money. Remember that parlays are high-risk bets with low win probability.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Select Events
                </CardTitle>
                <CardDescription>
                  Choose events to add to your parlay. Each event can only be selected once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sport Selection */}
                <div className="flex gap-2 flex-wrap">
                  {sportsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-9 w-20" />
                    ))
                  ) : (
                    sports?.slice(0, 8).map((sport) => (
                      <Button
                        key={sport.key}
                        variant={selectedSport === sport.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSport(sport.key)}
                      >
                        {sport.title}
                      </Button>
                    ))
                  )}
                </div>

                {/* Events List */}
                <ScrollArea className="h-[500px] pr-4">
                  {eventsLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : events && events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event) => {
                        const isInParlay = parlayLegs.some(leg => leg.eventId === event.id);
                        const h2hMarket = event.bookmakers?.[0]?.markets?.find(m => m.key === "h2h");
                        
                        return (
                          <Card 
                            key={event.id} 
                            className={`${isInParlay ? "border-primary/50 bg-primary/5" : ""}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium">{event.home_team} vs {event.away_team}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(event.commence_time)}
                                  </p>
                                </div>
                                {isInParlay && (
                                  <Badge variant="default">In Parlay</Badge>
                                )}
                              </div>
                              
                              {h2hMarket && (
                                <div className="grid grid-cols-2 gap-2">
                                  {h2hMarket.outcomes.map((outcome) => (
                                    <Button
                                      key={outcome.name}
                                      variant="outline"
                                      size="sm"
                                      className="flex justify-between"
                                      disabled={isInParlay}
                                      onClick={() => addLeg(event, outcome.name, outcome.price, "moneyline")}
                                    >
                                      <span className="truncate mr-2">{outcome.name}</span>
                                      <span className={outcome.price > 0 ? "text-green-400" : "text-red-400"}>
                                        {formatOdds(outcome.price)}
                                      </span>
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No events available for this sport.</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Parlay Slip */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Parlay Slip
                </CardTitle>
                <CardDescription>
                  {parlayLegs.length} selection{parlayLegs.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {parlayLegs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No selections yet</p>
                    <p className="text-sm">Add events from the left to build your parlay</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {parlayLegs.map((leg, index) => (
                          <div
                            key={`${leg.eventId}-${index}`}
                            className="p-3 rounded-lg bg-secondary/50 relative group"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeLeg(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <p className="font-medium text-sm pr-6">{leg.selection}</p>
                            <p className="text-xs text-muted-foreground">
                              {leg.homeTeam} vs {leg.awayTeam}
                            </p>
                            <p className={`text-sm font-bold mt-1 ${leg.odds > 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatOdds(leg.odds)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {parlayLegs.length >= 2 && parlayCalc && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Combined Odds</span>
                          <span className={`font-bold ${parlayCalc.combinedOdds > 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatOdds(parlayCalc.combinedOdds)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Implied Probability</span>
                          <span className="font-medium">{parlayCalc.impliedProbability}%</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-3 border-t">
                      <Label htmlFor="parlay-stake">Stake Amount ($)</Label>
                      <Input
                        id="parlay-stake"
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        min="1"
                        max={wallet?.balance ? parseFloat(wallet.balance) : 10000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: ${wallet?.balance || "0.00"}
                      </p>
                    </div>

                    {parlayLegs.length >= 2 && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Potential Payout</span>
                          <span className="text-xl font-bold text-primary">
                            ${calculatePayout().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={parlayLegs.length < 2 || placeParlayMutation.isPending}
                      onClick={placeParlay}
                    >
                      {placeParlayMutation.isPending ? "Placing..." : "Place Parlay"}
                    </Button>

                    {parlayLegs.length < 2 && (
                      <p className="text-xs text-center text-muted-foreground">
                        Add at least 2 selections to place a parlay
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Parlay Warning */}
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500">High Risk Warning</p>
                    <p className="text-muted-foreground mt-1">
                      Parlays have a low probability of winning. The more legs you add, the lower your chances.
                      {parlayCalc && parlayLegs.length >= 2 && (
                        <span className="block mt-1">
                          Current win probability: <strong>{parlayCalc.impliedProbability}%</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
