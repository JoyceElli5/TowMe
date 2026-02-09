-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES towing_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Row Level Security (RLS) Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
CREATE POLICY "Participants can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update messages they received (e.g. mark as read)
CREATE POLICY "Receivers can mark messages as read" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Use a service role policy for the backend API
CREATE POLICY "Service role can manage all messages" ON messages
  FOR ALL USING (auth.role() = 'service_role');

-- Enable Supabase Realtime for instant updates
-- Check if the publication already exists or if we need to add a table to it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE messages;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
END $$;

-- Grant permissions to authenticated users
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO service_role;
