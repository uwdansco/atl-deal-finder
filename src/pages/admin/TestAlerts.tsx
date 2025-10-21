import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TestAlerts = () => {
  const [isTriggeringPriceCheck, setIsTriggeringPriceCheck] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [emailQueueStats, setEmailQueueStats] = useState<any>(null);

  const handleTriggerPriceCheck = async () => {
    try {
      setIsTriggeringPriceCheck(true);
      setResults(null);
      
      toast.info("Starting price check... This may take a few minutes");
      
      const { data, error } = await supabase.functions.invoke('check-flight-prices');

      if (error) throw error;

      setResults(data);
      toast.success(`Price check complete! ${data.alertsTriggered || 0} alerts triggered`);
      
      // Refresh email queue stats
      await fetchEmailQueueStats();
    } catch (error: any) {
      console.error('Error triggering price check:', error);
      toast.error(`Failed to trigger price check: ${error.message}`);
    } finally {
      setIsTriggeringPriceCheck(false);
    }
  };

  const handleProcessEmailQueue = async () => {
    try {
      setIsProcessingQueue(true);
      
      toast.info("Processing email queue...");
      
      const { data, error } = await supabase.functions.invoke('process-email-queue');

      if (error) throw error;

      toast.success(`Email queue processed! ${data.emailsSent || 0} emails sent`);
      
      // Refresh email queue stats
      await fetchEmailQueueStats();
    } catch (error: any) {
      console.error('Error processing email queue:', error);
      toast.error(`Failed to process email queue: ${error.message}`);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const fetchEmailQueueStats = async () => {
    try {
      const { data: pending, error: pendingError } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: sent, error: sentError } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');

      const { data: failed, error: failedError } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      if (!pendingError && !sentError && !failedError) {
        setEmailQueueStats({
          pending: pending || 0,
          sent: sent || 0,
          failed: failed || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching email queue stats:', error);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select(`
          *,
          destinations (city_name, country)
        `)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }
  };

  useState(() => {
    fetchEmailQueueStats();
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Alert System</h1>
        <p className="text-muted-foreground mt-2">
          Manually trigger price checks and email processing to test the alert system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Price Check</CardTitle>
            <CardDescription>
              Check flight prices for all active destinations and trigger alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTriggerPriceCheck}
              disabled={isTriggeringPriceCheck}
              className="w-full"
            >
              {isTriggeringPriceCheck ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Prices...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Price Check
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Queue</CardTitle>
            <CardDescription>
              Process pending emails in the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleProcessEmailQueue}
              disabled={isProcessingQueue}
              className="w-full"
            >
              {isProcessingQueue ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Process Email Queue
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {emailQueueStats && (
        <Card>
          <CardHeader>
            <CardTitle>Email Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{emailQueueStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{emailQueueStats.sent}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{emailQueueStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Price Check Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div>✅ <strong>{results.destinationsChecked}</strong> destinations checked</div>
                  <div>🔔 <strong>{results.alertsTriggered}</strong> alerts triggered</div>
                </div>
              </AlertDescription>
            </Alert>

            {results.results && results.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Price Details:</h4>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {results.results.map((result: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {result.error ? (
                        <div className="text-destructive">
                          ❌ {result.destination}: {result.error}
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium">{result.destination}</span>: 
                          ${result.price} 
                          {result.quality && (
                            <span className="ml-2 text-xs px-2 py-1 bg-primary/10 rounded">
                              {result.quality}
                            </span>
                          )}
                          {result.savings && (
                            <span className="ml-2 text-green-600">
                              {result.savings}% savings
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Price Check:</strong> Runs every 2 hours via cron job (jobid 6). You can manually trigger it above.
          </div>
          <div>
            <strong>2. Alert Creation:</strong> When prices drop below user thresholds, alerts are created in the database and added to the email queue.
          </div>
          <div>
            <strong>3. Email Processing:</strong> Runs every 5 minutes via cron job (jobid 5). Sends pending emails from the queue.
          </div>
          <div>
            <strong>4. Alert Criteria:</strong> Price must be below threshold, meet minimum quality level, respect cooldown period, and not exceed weekly limits.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAlerts;
