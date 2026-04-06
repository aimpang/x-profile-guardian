
CREATE TABLE public.x_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL UNIQUE,
  code_verifier text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.x_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own oauth states"
ON public.x_oauth_states FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth states"
ON public.x_oauth_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth states"
ON public.x_oauth_states FOR DELETE
USING (auth.uid() = user_id);
