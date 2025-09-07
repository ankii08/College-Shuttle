-- Fix user_roles RLS policy to allow self-role creation on signup

-- Add policy to allow users to insert their own role record
CREATE POLICY "Users can create their own role on signup"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Also add a policy specifically for updating own role (for future flexibility)
CREATE POLICY "Users can update their own role"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
