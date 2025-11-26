import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

const AccountSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState('instant');
  const [maxAlertsPerWeek, setMaxAlertsPerWeek] = useState(10);
  const [quietHoursStart, setQuietHoursStart] = useState(22);
  const [quietHoursEnd, setQuietHoursEnd] = useState(8);
  const [destinationCount, setDestinationCount] = useState(0);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      fetchDestinationCount();
      fetchUserPreferences();
    }
  }, [user]);

  const fetchDestinationCount = async () => {
    if (!user) return;

    const { count } = await (supabase as any)
      .from('user_destinations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    setDestinationCount(count || 0);
  };

  const fetchUserPreferences = async () => {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (data) {
      setEmailNotifications(data.email_notifications_enabled);
      setEmailFrequency(data.email_frequency || 'instant');
      setMaxAlertsPerWeek(data.max_alerts_per_week || 10);
      setQuietHoursStart(data.quiet_hours_start ?? 22);
      setQuietHoursEnd(data.quiet_hours_end ?? 8);
    }
  };

  const handleUpdatePreferences = async () => {
    setPreferencesLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          email_notifications_enabled: emailNotifications,
          email_frequency: emailFrequency,
          max_alerts_per_week: maxAlertsPerWeek,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your profile has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast({
      title: 'Feature coming soon',
      description: 'Account deletion will be available soon. Please contact support for now.',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-3xl font-bold">Account Settings</h2>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed at this time
            </p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Price Alert Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails when prices drop below your thresholds
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Email Frequency</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="instant"
                  name="frequency"
                  value="instant"
                  checked={emailFrequency === 'instant'}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="instant" className="font-normal cursor-pointer">
                  Instant - Get notified immediately when deals are found
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="daily"
                  name="frequency"
                  value="daily_digest"
                  checked={emailFrequency === 'daily_digest'}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="daily" className="font-normal cursor-pointer">
                  Daily Digest - Receive a summary once per day
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="weekly"
                  name="frequency"
                  value="weekly_digest"
                  checked={emailFrequency === 'weekly_digest'}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">
                  Weekly Digest - Receive a summary once per week
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Maximum Alerts Per Week</Label>
              <Badge variant="secondary">{maxAlertsPerWeek}</Badge>
            </div>
            <Input
              type="range"
              min="1"
              max="20"
              value={maxAlertsPerWeek}
              onChange={(e) => setMaxAlertsPerWeek(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of price alerts you receive each week
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Quiet Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quietStart" className="text-sm font-normal">Start</Label>
                <Input
                  id="quietStart"
                  type="number"
                  min="0"
                  max="23"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quietEnd" className="text-sm font-normal">End</Label>
                <Input
                  id="quietEnd"
                  type="number"
                  min="0"
                  max="23"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Don't send alerts during these hours (24-hour format)
            </p>
          </div>

          <Button onClick={handleUpdatePreferences} disabled={preferencesLoading}>
            {preferencesLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Information</CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan</span>
            <Badge variant="secondary">Free</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Destinations Tracked</span>
            <Badge>{destinationCount}/10</Badge>
          </div>

          <Separator />

          <Button variant="outline" className="w-full" disabled>
            Upgrade to Pro (Coming Soon)
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Pro plan will include unlimited destinations and advanced features
          </p>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account security and data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Change Password</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Update your password to keep your account secure
            </p>
            <Button variant="outline" disabled>
              Change Password (Coming Soon)
            </Button>
          </div>

          <Separator />

          <div>
            <Label className="text-destructive">Danger Zone</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Permanently delete your account and all associated data
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your tracked destinations and price alerts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
