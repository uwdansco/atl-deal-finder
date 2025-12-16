import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Eye, Send } from "lucide-react";

export default function SendEmailPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const { data: subscriberCount } = useQuery({
    queryKey: ["active-subscribers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("is_verified", true);
      if (error) throw error;
      return count || 0;
    },
  });

  const sendEmail = useMutation({
    mutationFn: async () => {
      // This would call a new edge function to send bulk emails
      // For now, we'll show a toast
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: { subject, body },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent!",
        description: `Successfully sent to ${subscriberCount} subscribers`,
      });
      setSubject("");
      setBody("");
      setShowConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!subject || !body) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and body",
        variant: "destructive",
      });
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = () => {
    sendEmail.mutate();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Send Email Blast</h1>
        <p className="text-muted-foreground">
          Send a custom email to all active subscribers
        </p>
      </div>

      <div className="grid gap-6">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active, verified subscribers
            </p>
          </CardContent>
        </Card>

        {/* Email Form */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Create a custom email message to send to all subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Amazing Flight Deals to Europe!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Keep it short and engaging (under 60 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                placeholder="Dear Traveler,

We've found some incredible deals for you...

Best regards,
Cheap Singapore Flights Team"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Write your message in plain text. Links and formatting will be preserved.
              </p>
            </div>

            <div className="flex gap-3">
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Email Preview</DialogTitle>
                  </DialogHeader>
                  <div className="border rounded-lg p-6 bg-muted/30">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Subject:</p>
                      <p className="font-semibold text-lg">{subject || "(No subject)"}</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="whitespace-pre-wrap font-sans">
                        {body || "(No content)"}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
                      <p>© {new Date().getFullYear()} Cheap Singapore Flights</p>
                      <p>You're receiving this because you subscribed to our flight deals.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleSend} disabled={!subject || !body}>
                <Mail className="h-4 w-4 mr-2" />
                Send to All Subscribers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Email Send</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                You are about to send this email to{" "}
                <strong>{subscriberCount}</strong> subscribers.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Subject:</p>
                <p className="text-sm">{subject}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Make sure you've previewed your
                email and checked for any errors.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSend} disabled={sendEmail.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {sendEmail.isPending ? "Sending..." : "Confirm & Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tips Card */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Email Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Keep subject lines under 60 characters</li>
              <li>• Use a clear, friendly tone</li>
              <li>• Include a clear call-to-action</li>
              <li>• Always preview before sending</li>
              <li>• Send during business hours for better engagement</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
