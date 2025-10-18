import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OnboardingWelcome } from '@/components/onboarding/OnboardingWelcome';
import { OnboardingDestinations } from '@/components/onboarding/OnboardingDestinations';
import { OnboardingThresholds } from '@/components/onboarding/OnboardingThresholds';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';

export type Destination = {
  id: string;
  city_name: string;
  country: string;
  airport_code: string;
  region: string;
  average_price: number;
  image_url: string | null;
};

export type SelectedDestination = Destination & {
  threshold: number;
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<SelectedDestination[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get user info
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]);
      }
    };
    getUserData();
  }, []);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert user destinations
      const userDestinations = selectedDestinations.map(dest => ({
        user_id: user.id,
        destination_id: dest.id,
        price_threshold: Number(dest.threshold),
        is_active: true,
      }));

      const { error: insertError } = await (supabase as any)
        .from('user_destinations')
        .insert(userDestinations);

      if (insertError) throw insertError;

      // Call welcome email edge function
      try {
        await supabase.functions.invoke('send-welcome', {
          body: {
            subscriberId: user.id,
            email: user.email,
            name: userName,
          },
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail onboarding if email fails
      }

      toast({
        title: 'Success!',
        description: 'Your account is all set up.',
      });

      // Navigate to dashboard or home
      navigate('/');
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

  return (
    <div className="min-h-screen bg-gradient-hero">
      {step === 1 && (
        <OnboardingWelcome
          userName={userName}
          onNext={() => setStep(2)}
        />
      )}
      
      {step === 2 && (
        <OnboardingDestinations
          selectedDestinations={selectedDestinations}
          onNext={(destinations) => {
            setSelectedDestinations(destinations);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      
      {step === 3 && (
        <OnboardingThresholds
          selectedDestinations={selectedDestinations}
          onNext={(destinations) => {
            setSelectedDestinations(destinations);
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}
      
      {step === 4 && (
        <OnboardingComplete
          destinationCount={selectedDestinations.length}
          onFinish={handleComplete}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Onboarding;
