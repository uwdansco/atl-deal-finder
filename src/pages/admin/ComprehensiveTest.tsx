import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, PlayCircle, Mail, Database, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface TestResults {
  priceCheck?: any;
  emailProcessing?: any;
  deliverability?: any;
}

const ComprehensiveTest = () => {
  const [isRunningFullTest, setIsRunningFullTest] = useState(false);
  const [testResults, setTestResults] = useState<TestResults>({});
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [emailQueueStatus, setEmailQueueStatus] = useState<any>(null);

  const fetchSystemStatus = async () => {
    try {
      // Get destinations with user tracking info
      const { data: destinations } = await supabase
        .from("destinations")
        .select(`
          id,
          city_name,
          airport_code,
          is_active,
          user_destinations(count)
        `)
        .eq("is_active", true);

      // Get price statistics
      const { data: priceStats } = await supabase
        .from("price_statistics")
        .select("*");

      // Get email queue status
      const { data: queueStatus } = await supabase
        .from("email_queue")
        .select("status")
        .order("created_at", { ascending: false })
        .limit(100);

      const queueSummary = {
        pending: queueStatus?.filter(q => q.status === "pending").length || 0,
        sent: queueStatus?.filter(q => q.status === "sent").length || 0,
        failed: queueStatus?.filter(q => q.status === "failed").length || 0,
      };

      setEmailQueueStatus(queueSummary);

      // Get recent price history
      const { data: recentPrices } = await supabase
        .from("price_history")
        .select("*, destinations(city_name, airport_code)")
        .order("checked_at", { ascending: false })
        .limit(10);

      setSystemStatus({
        destinations: destinations || [],
        priceStats: priceStats || [],
        recentPrices: recentPrices || [],
        emailQueue: queueSummary,
      });
    } catch (error) {
      console.error("Error fetching system status:", error);
      toast.error("Failed to fetch system status");
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      const { data: alerts } = await supabase
        .from("price_alerts")
        .select(`
          *,
          destinations(city_name, airport_code, country)
        `)
        .order("received_at", { ascending: false })
        .limit(20);

      setRecentAlerts(alerts || []);
    } catch (error) {
      console.error("Error fetching recent alerts:", error);
    }
  };

  const runFullTest = async () => {
    setIsRunningFullTest(true);
    setTestResults({});
    
    try {
      toast.info("🚀 Starting comprehensive test...", { duration: 3000 });

      // STEP 1: Price Check (all mode for comprehensive test)
      toast.info("Step 1/3: Checking flight prices (all destinations)...", { duration: 5000 });
      const { data: priceCheckData, error: priceCheckError } = await supabase.functions.invoke(
        "check-flight-prices",
        { body: { check_mode: "all" } }
      );

      if (priceCheckError) {
        throw new Error(`Price check failed: ${priceCheckError.message}`);
      }

      setTestResults(prev => ({ ...prev, priceCheck: priceCheckData }));
      toast.success(`✅ Price check complete! ${priceCheckData?.alertsTriggered || 0} alerts triggered`);

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // STEP 2: Process Email Queue
      toast.info("Step 2/3: Processing email queue...", { duration: 5000 });
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        "process-email-queue"
      );

      if (emailError) {
        throw new Error(`Email processing failed: ${emailError.message}`);
      }

      setTestResults(prev => ({ ...prev, emailProcessing: emailData }));
      toast.success(`✅ Email queue processed! ${emailData?.processed || 0} emails sent`);

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // STEP 3: Verify Deliverability
      toast.info("Step 3/3: Verifying email deliverability...");
      await fetchSystemStatus();
      await fetchRecentAlerts();

      const deliverability = {
        alertsCreated: priceCheckData?.alertsTriggered || 0,
        emailsSent: emailData?.processed || 0,
        success: (emailData?.processed || 0) > 0,
      };

      setTestResults(prev => ({ ...prev, deliverability }));

      if (deliverability.success) {
        toast.success("🎉 Comprehensive test completed successfully!", { duration: 5000 });
      } else {
        toast.warning("⚠️ Test completed but no emails were sent. Check if there are active user destinations.", { duration: 5000 });
      }

    } catch (error: any) {
      console.error("Test failed:", error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsRunningFullTest(false);
      await fetchSystemStatus();
    }
  };

  const runPriorityCheck = async () => {
    try {
      toast.info("🎯 Checking priority destinations only...");
      const { data, error } = await supabase.functions.invoke(
        "check-flight-prices",
        { body: { check_mode: "priority" } }
      );
      
      if (error) throw error;
      
      toast.success(`✅ Priority check complete! Checked ${data.destinationsChecked} destinations, ${data.alertsTriggered} alerts triggered`);
      await fetchSystemStatus();
      await fetchRecentAlerts();
    } catch (error: any) {
      toast.error(`Priority check failed: ${error.message}`);
    }
  };

  const runInactiveCheck = async () => {
    try {
      toast.info("💤 Checking inactive destinations...");
      const { data, error } = await supabase.functions.invoke(
        "check-flight-prices",
        { body: { check_mode: "inactive" } }
      );
      
      if (error) throw error;
      
      toast.success(`✅ Inactive check complete! Checked ${data.destinationsChecked} destinations, ${data.alertsTriggered} alerts triggered`);
      await fetchSystemStatus();
      await fetchRecentAlerts();
    } catch (error: any) {
      toast.error(`Inactive check failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    fetchRecentAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchRecentAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Database className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comprehensive Alert System Test</h1>
        <p className="text-muted-foreground mt-2">
          End-to-end testing of price monitoring, alert generation, and email delivery
        </p>
      </div>

      {/* Run Full Test Button */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-6 w-6" />
            Run Complete Test
          </CardTitle>
          <CardDescription>
            This will trigger price checks, generate alerts, and process the email queue to test the entire pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Button
              onClick={runFullTest}
              disabled={isRunningFullTest}
              size="lg"
              className="w-full"
            >
              {isRunningFullTest ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Comprehensive Test...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start Full System Test (All Destinations)
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={runPriorityCheck}
                disabled={isRunningFullTest}
                variant="outline"
                size="lg"
              >
                🎯 Test Priority Mode
              </Button>
              
              <Button
                onClick={runInactiveCheck}
                disabled={isRunningFullTest}
                variant="outline"
                size="lg"
              >
                💤 Test Inactive Mode
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center mt-2">
              Priority = User-tracked destinations | Inactive = No active users
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="priceCheck">Price Check</TabsTrigger>
                <TabsTrigger value="emails">Email Processing</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Destinations Checked</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {testResults.priceCheck?.destinationsChecked || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Alerts Triggered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">
                        {testResults.priceCheck?.alertsTriggered || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {testResults.emailProcessing?.processed || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {testResults.deliverability && (
                  <Alert className={testResults.deliverability.success ? "border-green-600" : "border-yellow-600"}>
                    <AlertTitle className="flex items-center gap-2">
                      {testResults.deliverability.success ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Test Passed Successfully
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          Test Completed with Warnings
                        </>
                      )}
                    </AlertTitle>
                    <AlertDescription>
                      {testResults.deliverability.success ? (
                        <p>All systems are functioning correctly. Alerts were triggered and emails were successfully sent.</p>
                      ) : (
                        <p>Price checks completed but no emails were sent. This may be due to: no prices below thresholds, insufficient price history, or cooldown periods.</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="priceCheck" className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(testResults.priceCheck, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="emails" className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(testResults.emailProcessing, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* System Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.destinations?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tracked Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {systemStatus?.destinations?.filter((d: any) => d.user_destinations?.length > 0).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Emails Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {emailQueueStatus?.pending || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Alerts (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recentAlerts.filter(a => {
                const hoursSince = (Date.now() - new Date(a.received_at).getTime()) / (1000 * 60 * 60);
                return hoursSince < 24;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts Table */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Price Alerts
            </CardTitle>
            <CardDescription>Latest 20 alerts triggered by the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Destination</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-center p-2">Quality</th>
                    <th className="text-center p-2">Savings</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-right p-2">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlerts.map((alert: any) => (
                    <tr key={alert.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">
                        {alert.destinations?.city_name}
                      </td>
                      <td className="p-2 text-right font-semibold text-green-600">
                        ${Math.round(alert.price)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="outline">{alert.deal_quality || "N/A"}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        {alert.savings_percent ? `${alert.savings_percent}%` : "-"}
                      </td>
                      <td className="p-2 text-center">
                        {alert.sent_to_subscribers ? (
                          <Badge className="bg-green-100 text-green-800">Sent</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                      <td className="p-2 text-right text-xs text-muted-foreground">
                        {alert.sent_at
                          ? new Date(alert.sent_at).toLocaleString()
                          : "Not sent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Queue Status */}
      {emailQueueStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Email Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-yellow-600">
                  {emailQueueStatus.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {emailQueueStatus.sent}
                </div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">
                  {emailQueueStatus.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>How to Run a Complete Test</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>Click the "Start Full System Test" button above</li>
                <li>The system will check prices for all active destinations (takes 30-60 seconds)</li>
                <li>Alerts will be generated for prices below user thresholds</li>
                <li>The email queue will be processed automatically</li>
                <li>Check your email inbox for alert notifications</li>
                <li>Review the results in the Test Results section</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTitle>Alert Trigger Criteria</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Price must be below user's threshold</li>
                <li>Deal quality must meet minimum requirement (default: "good")</li>
                <li>At least 3 price samples must exist for the destination</li>
                <li>Cooldown period must have passed (default: 7 days)</li>
                <li>Weekly alert limit must not be exceeded (default: 10)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTitle>Common Issues</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>No alerts triggered:</strong> Current prices may be above all thresholds. Try setting higher thresholds temporarily for testing.</li>
                <li><strong>No emails sent:</strong> Email queue may be empty or email notifications may be disabled in user preferences.</li>
                <li><strong>API rate limits:</strong> Amadeus test API has 1,000 calls/month limit. System automatically falls back to Google Flights (SerpAPI).</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveTest;
