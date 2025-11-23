-- Create enum type for user type
CREATE TYPE user_type_enum AS ENUM ('STANDARD', 'PREMIUM');

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  type user_type_enum NOT NULL DEFAULT 'STANDARD',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile cards table
CREATE TABLE IF NOT EXISTS profile_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  pronunciation_audio_url TEXT,
  phonetic_text TEXT,
  photo_url TEXT,
  short_bio TEXT,
  nationality TEXT,
  fun_fact TEXT,
  links TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  join_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Card statuses table
CREATE TABLE IF NOT EXISTS card_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_card_id UUID NOT NULL REFERENCES profile_cards(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  is_known BOOLEAN NOT NULL DEFAULT false,
  last_reviewed_at BIGINT NOT NULL,
  UNIQUE(viewer_user_id, profile_card_id, group_id)
);

-- Invitations table (optional, for future email invites)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_at BIGINT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_cards_user_id ON profile_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by_user_id ON groups(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);
CREATE INDEX IF NOT EXISTS idx_memberships_group_id ON memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_card_statuses_viewer_user_id ON card_statuses(viewer_user_id);
CREATE INDEX IF NOT EXISTS idx_card_statuses_profile_card_id ON card_statuses(profile_card_id);
CREATE INDEX IF NOT EXISTS idx_card_statuses_group_id ON card_statuses(group_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_cards_updated_at BEFORE UPDATE ON profile_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read other users' basic info (for groups, etc.)
CREATE POLICY "Users can read other users" ON users
  FOR SELECT USING (true);

-- RLS Policies for profile_cards table
-- Users can read all profile cards (for deck viewing)
CREATE POLICY "Users can read all profile cards" ON profile_cards
  FOR SELECT USING (true);

-- Users can update their own profile card
CREATE POLICY "Users can update own profile card" ON profile_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile card
CREATE POLICY "Users can insert own profile card" ON profile_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for groups table
-- Users can read public groups
CREATE POLICY "Users can read public groups" ON groups
  FOR SELECT USING (is_public = true);

-- Users can read groups they are members of
CREATE POLICY "Users can read member groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.group_id = groups.id
      AND memberships.user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);

-- Group creators can update their groups
CREATE POLICY "Group creators can update groups" ON groups
  FOR UPDATE USING (auth.uid() = created_by_user_id);

-- RLS Policies for memberships table
-- Users can read memberships for groups they belong to
CREATE POLICY "Users can read group memberships" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.group_id = memberships.group_id
      AND m.user_id = auth.uid()
    )
  );

-- Users can create memberships (join groups)
CREATE POLICY "Users can join groups" ON memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" ON memberships
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for card_statuses table
-- Users can read their own card statuses
CREATE POLICY "Users can read own card statuses" ON card_statuses
  FOR SELECT USING (auth.uid() = viewer_user_id);

-- Users can create/update their own card statuses
CREATE POLICY "Users can manage own card statuses" ON card_statuses
  FOR ALL USING (auth.uid() = viewer_user_id)
  WITH CHECK (auth.uid() = viewer_user_id);

-- RLS Policies for invitations table
-- Users can read invitations for groups they created
CREATE POLICY "Users can read own group invitations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = invitations.group_id
      AND groups.created_by_user_id = auth.uid()
    )
  );

-- Group creators can create invitations
CREATE POLICY "Group creators can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = invitations.group_id
      AND groups.created_by_user_id = auth.uid()
    )
  );

