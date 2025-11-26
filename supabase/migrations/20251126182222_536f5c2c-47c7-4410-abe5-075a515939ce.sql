
-- Fix password_reset_tokens RLS policies
CREATE POLICY "Users can view own reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert reset tokens" 
ON public.password_reset_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (true);
