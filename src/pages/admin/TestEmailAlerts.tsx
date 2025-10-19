import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Play, Mail, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TestEmailAlerts = () => {
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [emailResult, setEmailResult] = useState<any>(null);

  const handlePriceCheck = async () => {
    setIsCheckingPrices(true);
    setCheckResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-flight-prices');
      
      if (error) throw error;
      
      setCheckResult(data);
      toast.success('Price check completed! Check the results below.');
    } catch (error: any) {
      console.error('Price check error:', error);
      toast.error(`Failed to check prices: ${error.message}`);
    } finally {
      setIsCheckingPrices(false);
    }
  };

  const handleProcessEmails = async () => {
    setIsProcessingEmails(true);
    setEmailResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue');
      
      if (error) throw error;
      
      setEmailResult(data);
      toast.success('Email processing completed! Check the results below.');
    } catch (error: any) {
      console.error('Email processing error:', error);
      toast.error(`Failed to process emails: ${error.message}`);
    } finally {
      setIsProcessingEmails(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      // Check price history
      const { data: priceHistory, error: phError } = await supabase
        .from('price_history')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(5);

      if (phError) throw phError;

      // Check email queue
      const { data: emailQueue, error: eqError } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (eqError) throw eqError;

      // Check price alerts
      const { data: priceAlerts, error: paError } = await supabase
        .from('price_alerts')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(5);

      if (paError) throw paError;

      console.log('Database Status:', {
        priceHistory,
        emailQueue,
        priceAlerts
      });

      toast.success('Database status logged to console');
    } catch (error: any) {
      toast.error(`Database check failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Email Alert System</h1>
        <p className="text-muted-foreground">
          Manually trigger price checks and email processing to test the alert system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Step 1: Check Flight Prices
            </CardTitle>
            <CardDescription>
              This will query flight prices for all active destinations and create price alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handlePriceCheck} 
              disabled={isCheckingPrices}
              className="w-full"
            >
              {isCheckingPrices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Prices...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Price Check
                </>
              )}
            </Button>

            {checkResult && (
              <Alert>
                <AlertDescription>
                  <div className="text-sm space-y-2">
                    <div className="font-semibold">Results:</div>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(checkResult, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Step 2: Process Email Queue
            </CardTitle>
            <CardDescription>
              This will send emails for all queued price alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleProcessEmails} 
              disabled={isProcessingEmails}
              className="w-full"
            >
              {isProcessingEmails ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Emails...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Process Email Queue
                </>
              )}
            </Button>

            {emailResult && (
              <Alert>
                <AlertDescription>
                  <div className="text-sm space-y-2">
                    <div className="font-semibold">Results:</div>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(emailResult, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Check the current state of price history, email queue, and price alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkDatabaseStatus}
            variant="outline"
            className="w-full"
          >
            <Database className="mr-2 h-4 w-4" />
            Check Database Status (see console)
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          <div className="text-sm space-y-2">
            <div className="font-semibold">How to Test:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Run Price Check" to fetch flight prices and create alerts</li>
              <li>Click "Process Email Queue" to send the alert emails</li>
              <li>Check your email inbox for the price alert notification</li>
              <li>Use "Check Database Status" to view data in the console</li>
            </ol>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TestEmailAlerts;
