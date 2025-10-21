import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TestEmail = () => {
  const [email, setEmail] = useState("dan@alivadigital.com");
  const [name, setName] = useState("Dan");
  const [isSending, setIsSending] = useState(false);

  const handleSendTestEmail = async () => {
    try {
      setIsSending(true);
      
      const { data, error } = await supabase.functions.invoke('send-welcome', {
        body: {
          email,
          name
        }
      });

      if (error) throw error;

      toast.success(`Test email sent successfully to ${email}`);
      console.log('Email sent:', data);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Send a test welcome email with a featured deal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipient Name"
            />
          </div>

          <Button 
            onClick={handleSendTestEmail}
            disabled={isSending || !email}
            className="w-full"
          >
            {isSending ? "Sending..." : "Send Test Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestEmail;
