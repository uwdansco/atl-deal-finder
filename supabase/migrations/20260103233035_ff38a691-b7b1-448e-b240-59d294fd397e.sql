-- Create a SECURITY DEFINER function to handle email verification
-- This avoids exposing subscriber data via broad RLS policies

CREATE OR REPLACE FUNCTION public.verify_subscriber_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscriber record;
BEGIN
  -- Validate token input
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token format');
  END IF;

  -- Find subscriber with token
  SELECT id, email, name, is_verified INTO v_subscriber
  FROM subscribers
  WHERE verification_token = p_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired verification link');
  END IF;
  
  IF v_subscriber.is_verified THEN
    RETURN json_build_object(
      'success', true, 
      'already_verified', true,
      'email', v_subscriber.email,
      'name', v_subscriber.name
    );
  END IF;
  
  -- Update subscriber to verified
  UPDATE subscribers
  SET is_verified = true,
      is_active = true,
      verification_token = NULL,
      updated_at = now()
  WHERE id = v_subscriber.id;
  
  RETURN json_build_object(
    'success', true,
    'already_verified', false,
    'email', v_subscriber.email,
    'name', v_subscriber.name
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_subscriber_token(text) TO anon, authenticated;