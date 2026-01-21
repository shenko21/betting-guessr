import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  TrendingUp, 
  Target, 
  Layers, 
  Brain, 
  Shield, 
  BarChart3,
  ArrowRight,
  AlertTriangle,
  Wallet,
  Zap
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BetWise</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>AI-Powered Sports Betting Analysis</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Make Smarter Bets with{" "}
              <span className="text-primary">Data-Driven</span> Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Practice sports betting with virtual money. Our AI analyzes odds, identifies value bets, 
              and helps you build winning strategies—all without risking real money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2">
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Link href="/responsible-gambling">
                <Button size="lg" variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Learn About Safe Betting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Warning Banner */}
      <section className="border-y border-yellow-500/30 bg-yellow-500/10">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-3 text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <p className="text-sm">
              <strong>Educational Platform:</strong> This app uses virtual money only. 
              Gambling involves risk. Please gamble responsibly.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Learn Smart Betting</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines real-time data, AI predictions, and educational tools 
              to help you understand sports betting without financial risk.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Value Bet Detection</CardTitle>
                <CardDescription>
                  Our AI identifies betting opportunities where the odds offer positive expected value
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>AI Predictions</CardTitle>
                <CardDescription>
                  Statistical models including Poisson regression and Elo ratings power our predictions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Parlay Builder</CardTitle>
                <CardDescription>
                  Combine multiple selections and see combined odds and implied probabilities instantly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Paper Trading</CardTitle>
                <CardDescription>
                  Practice with $10,000 in virtual money. Test strategies without any financial risk
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Performance Tracking</CardTitle>
                <CardDescription>
                  Track your win rate, ROI, and betting history. Learn from your results over time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 hover:bg-card transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-yellow-500" />
                </div>
                <CardTitle>Responsible Gambling</CardTitle>
                <CardDescription>
                  Built-in limits, educational content, and resources to promote safe betting habits
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and begin learning about sports betting with zero risk
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up Free</h3>
              <p className="text-sm text-muted-foreground">
                Create your account and receive $10,000 in virtual betting funds instantly
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Explore & Learn</h3>
              <p className="text-sm text-muted-foreground">
                Browse events, view AI predictions, and understand value betting concepts
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Practice & Improve</h3>
              <p className="text-sm text-muted-foreground">
                Place virtual bets, track your performance, and refine your strategy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/20 via-background to-accent/20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
            <p className="text-muted-foreground">
              Join thousands of users who are learning about sports betting in a safe, 
              risk-free environment. No credit card required.
            </p>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">BetWise</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/responsible-gambling" className="hover:text-foreground transition-colors">
                Responsible Gambling
              </Link>
              <a 
                href="https://www.begambleaware.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                BeGambleAware
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Educational purposes only. No real money involved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
