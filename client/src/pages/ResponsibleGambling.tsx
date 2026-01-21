import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Shield, 
  Heart, 
  Phone, 
  ExternalLink,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { Link } from "wouter";

export default function ResponsibleGambling() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
            <Shield className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold">Responsible Gambling</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gambling should be entertaining, not a way to make money. This platform uses virtual money 
            to help you learn about sports betting without financial risk.
          </p>
        </div>

        {/* Important Notice */}
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">Important Notice</h3>
                <p className="text-sm">
                  This platform is for <strong>educational purposes only</strong> and uses virtual money. 
                  The predictions and analysis provided are not guarantees of real-world outcomes. 
                  If you choose to bet with real money elsewhere, please do so responsibly and within your means.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Principles */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                Do's
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  <span>Set a budget before you start and stick to it</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  <span>Only bet money you can afford to lose</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  <span>Take regular breaks from betting</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  <span>Keep track of time and money spent</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  <span>Balance gambling with other activities</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  <span>Seek help if gambling becomes a problem</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                Don'ts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                  <span>Never chase your losses</span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                  <span>Don't bet under the influence of alcohol or drugs</span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                  <span>Never borrow money to gamble</span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                  <span>Don't let gambling interfere with work or relationships</span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                  <span>Never gamble to escape problems or relieve stress</span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                  <span>Don't hide your gambling from loved ones</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Warning Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Warning Signs of Problem Gambling
            </CardTitle>
            <CardDescription>
              If you recognize any of these signs in yourself or someone you know, it may be time to seek help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-secondary/50">
                Spending more money and time on gambling than you can afford
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Finding it hard to manage or stop gambling
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Having arguments with family or friends about money and gambling
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Losing interest in usual activities or hobbies
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Always thinking or talking about gambling
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Lying about gambling or hiding it from others
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Chasing losses or gambling to get out of financial trouble
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Gambling until all your money is gone
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Borrowing money, selling possessions, or not paying bills to fund gambling
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                Feeling anxious, worried, guilty, or depressed about gambling
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Resources */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Get Help
            </CardTitle>
            <CardDescription>
              If you or someone you know needs help with problem gambling, these resources are available 24/7
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">National Council on Problem Gambling</h4>
                      <p className="text-lg font-bold text-primary">1-800-522-4700</p>
                      <p className="text-sm text-muted-foreground">24/7 Confidential Helpline</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Gamblers Anonymous</h4>
                      <a 
                        href="https://www.gamblersanonymous.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        www.gamblersanonymous.org
                      </a>
                      <p className="text-sm text-muted-foreground">Find local meetings and support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">BeGambleAware</h4>
                      <a 
                        href="https://www.begambleaware.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        www.begambleaware.org
                      </a>
                      <p className="text-sm text-muted-foreground">Free advice and support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">GamCare</h4>
                      <a 
                        href="https://www.gamcare.org.uk" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        www.gamcare.org.uk
                      </a>
                      <p className="text-sm text-muted-foreground">Support and counseling</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
