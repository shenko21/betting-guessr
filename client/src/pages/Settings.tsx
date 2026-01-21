import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  Wallet, 
  Bell, 
  Shield,
  DollarSign,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const { data: preferences, isLoading: prefsLoading } = trpc.preferences.get.useQuery();
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = trpc.wallet.get.useQuery();

  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [maxBetAmount, setMaxBetAmount] = useState("100");
  const [dailyBetLimit, setDailyBetLimit] = useState("500");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [depositAmount, setDepositAmount] = useState("1000");

  useEffect(() => {
    if (preferences) {
      setRiskTolerance(preferences.riskTolerance);
      setMaxBetAmount(preferences.maxBetAmount || "100");
      setDailyBetLimit(preferences.dailyBetLimit || "500");
      setNotificationsEnabled(preferences.notificationsEnabled ?? true);
    }
  }, [preferences]);

  const updatePrefsMutation = trpc.preferences.update.useMutation({
    onSuccess: () => {
      toast.success("Preferences updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const depositMutation = trpc.wallet.deposit.useMutation({
    onSuccess: (data) => {
      toast.success(`Deposited $${depositAmount}! New balance: $${data.newBalance}`);
      setDepositAmount("1000");
      refetchWallet();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSavePreferences = () => {
    updatePrefsMutation.mutate({
      riskTolerance,
      maxBetAmount: parseFloat(maxBetAmount),
      dailyBetLimit: parseFloat(dailyBetLimit),
      notificationsEnabled,
    });
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    depositMutation.mutate({ amount });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and betting limits
          </p>
        </div>

        {/* Virtual Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Virtual Wallet
            </CardTitle>
            <CardDescription>
              Manage your paper trading balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {walletLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-3xl font-bold text-primary">
                    ${parseFloat(wallet?.balance || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="deposit">Add Virtual Funds ($)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="1"
                      max="100000"
                    />
                  </div>
                  <Button onClick={handleDeposit} disabled={depositMutation.isPending}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {depositMutation.isPending ? "Adding..." : "Add Funds"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  This is virtual money for paper trading only. No real money is involved.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Risk Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Preferences
            </CardTitle>
            <CardDescription>
              Set your risk tolerance and betting limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {prefsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <Select value={riskTolerance} onValueChange={(v) => setRiskTolerance(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">
                        Conservative - Lower risk, smaller bets
                      </SelectItem>
                      <SelectItem value="moderate">
                        Moderate - Balanced approach
                      </SelectItem>
                      <SelectItem value="aggressive">
                        Aggressive - Higher risk, larger potential returns
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This affects the AI advisor's recommendations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBet">Maximum Bet Amount ($)</Label>
                  <Input
                    id="maxBet"
                    type="number"
                    value={maxBetAmount}
                    onChange={(e) => setMaxBetAmount(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum amount for a single bet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Betting Limit ($)</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={dailyBetLimit}
                    onChange={(e) => setDailyBetLimit(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum total bets per day
                  </p>
                </div>

                <Button onClick={handleSavePreferences} disabled={updatePrefsMutation.isPending}>
                  {updatePrefsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts about your bets and predictions
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Responsible Gambling */}
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Responsible Gambling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              This platform is designed for educational purposes using virtual money. 
              If you or someone you know has a gambling problem, please seek help.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Resources:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• National Council on Problem Gambling: 1-800-522-4700</li>
                <li>• Gamblers Anonymous: <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gamblersanonymous.org</a></li>
                <li>• BeGambleAware: <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.begambleaware.org</a></li>
              </ul>
            </div>
            <Button variant="outline" asChild>
              <a href="/responsible-gambling">Learn More About Responsible Gambling</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
