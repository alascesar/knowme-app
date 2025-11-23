/**
 * Database operations using Drizzle ORM schema and types with Supabase client execution.
 * 
 * This file uses a hybrid approach:
 * - Drizzle schema (drizzle/schema.ts) provides type-safe table definitions
 * - Drizzle types (InferSelectModel, InferInsertModel) ensure type safety
 * - Supabase client executes queries (required for client-side RLS support)
 * 
 * All database operations follow Drizzle patterns and use Drizzle schema types,
 * ensuring type safety while maintaining compatibility with Supabase's Row Level Security.
 */
import { supabase } from './supabase';
import { User, Group, ProfileCard, Membership, CardStatus, UserType } from '../types';
import { users, profileCards, groups, memberships, cardStatuses, invitations } from '../drizzle/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Type definitions from Drizzle schema
type DbUser = InferSelectModel<typeof users>;
type DbProfileCard = InferSelectModel<typeof profileCards>;
type DbGroup = InferSelectModel<typeof groups>;
type DbMembership = InferSelectModel<typeof memberships>;
type DbCardStatus = InferSelectModel<typeof cardStatuses>;

// Helper to convert database user to app User type
const dbUserToUser = (dbUser: DbUser | { id: string; name: string; email: string; type: string; avatar_url?: string | null }): User => ({
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  type: dbUser.type as UserType,
  avatarUrl: 'avatarUrl' in dbUser ? dbUser.avatarUrl || undefined : dbUser.avatar_url || undefined,
});

// Helper to convert database profile to app ProfileCard type
const dbProfileToProfileCard = (dbProfile: DbProfileCard | { 
  id: string; 
  user_id: string; 
  full_name: string; 
  pronunciation_audio_url?: string | null;
  phonetic_text?: string | null;
  photo_url?: string | null;
  short_bio?: string | null;
  nationality?: string | null;
  fun_fact?: string | null;
  links?: string[] | null;
}): ProfileCard => {
  const profile = 'userId' in dbProfile ? dbProfile : {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    fullName: dbProfile.full_name,
    pronunciationAudioUrl: dbProfile.pronunciation_audio_url || undefined,
    phoneticText: dbProfile.phonetic_text || undefined,
    photoUrl: dbProfile.photo_url || '',
    shortBio: dbProfile.short_bio || undefined,
    nationality: dbProfile.nationality || undefined,
    funFact: dbProfile.fun_fact || undefined,
    links: dbProfile.links || [],
  };
  return {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.fullName,
    pronunciationAudioUrl: profile.pronunciationAudioUrl,
    phoneticText: profile.phoneticText,
    photoUrl: profile.photoUrl,
    shortBio: profile.shortBio,
    nationality: profile.nationality,
    funFact: profile.funFact,
    links: profile.links || [],
  };
};

// Helper to convert app ProfileCard to database format
// Maps from Drizzle schema types (camelCase) to Supabase column names (snake_case)
const profileCardToDb = (profile: ProfileCard) => ({
  user_id: profile.userId,
  full_name: profile.fullName,
  pronunciation_audio_url: profile.pronunciationAudioUrl || null,
  phonetic_text: profile.phoneticText || null,
  photo_url: profile.photoUrl || null,
  short_bio: profile.shortBio || null,
  nationality: profile.nationality || null,
  fun_fact: profile.funFact || null,
  links: profile.links || null,
});

// Helper to convert database group to app Group type
const dbGroupToGroup = (dbGroup: DbGroup | {
  id: string;
  name: string;
  description: string;
  created_by_user_id: string;
  is_public: boolean;
  join_code: string;
}): Group => {
  if ('createdByUserId' in dbGroup) {
    return {
      id: dbGroup.id,
      name: dbGroup.name,
      description: dbGroup.description,
      createdByUserId: dbGroup.createdByUserId,
      isPublic: dbGroup.isPublic,
      joinCode: dbGroup.joinCode,
    };
  }
  return {
    id: dbGroup.id,
    name: dbGroup.name,
    description: dbGroup.description,
    createdByUserId: dbGroup.created_by_user_id,
    isPublic: dbGroup.is_public,
    joinCode: dbGroup.join_code,
  };
};

// Helper to convert database membership to app Membership type
const dbMembershipToMembership = (dbMembership: DbMembership | {
  id: string;
  group_id: string;
  user_id: string;
}): Membership => {
  if ('groupId' in dbMembership) {
    return {
      id: dbMembership.id,
      groupId: dbMembership.groupId,
      userId: dbMembership.userId,
    };
  }
  return {
    id: dbMembership.id,
    groupId: dbMembership.group_id,
    userId: dbMembership.user_id,
  };
};

// Helper to convert database card status to app CardStatus type
const dbCardStatusToCardStatus = (dbStatus: DbCardStatus | {
  id: string;
  viewer_user_id: string;
  profile_card_id: string;
  group_id: string;
  is_known: boolean;
  last_reviewed_at: number;
}): CardStatus => {
  if ('viewerUserId' in dbStatus) {
    return {
      id: dbStatus.id,
      viewerUserId: dbStatus.viewerUserId,
      profileCardId: dbStatus.profileCardId,
      groupId: dbStatus.groupId,
      isKnown: dbStatus.isKnown,
      lastReviewedAt: dbStatus.lastReviewedAt,
    };
  }
  return {
    id: dbStatus.id,
    viewerUserId: dbStatus.viewer_user_id,
    profileCardId: dbStatus.profile_card_id,
    groupId: dbStatus.group_id,
    isKnown: dbStatus.is_known,
    lastReviewedAt: dbStatus.last_reviewed_at,
  };
};

export const supabaseStorage = {
  // User operations
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !dbUser) return null;
    return dbUserToUser(dbUser);
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return dbUserToUser(data);
  },

  updatePassword: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(`Failed to update password: ${error.message}`);
  },

  // Profile operations
  getProfileByUserId: async (userId: string): Promise<ProfileCard | undefined> => {
    const { data, error } = await supabase
      .from('profile_cards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return undefined;
    return dbProfileToProfileCard(data);
  },

  updateProfile: async (profile: ProfileCard): Promise<ProfileCard> => {
    const updateData = profileCardToDb(profile);

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profile_cards')
      .select('id')
      .eq('id', profile.id)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('profile_cards')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update profile: ${error.message}`);
      return dbProfileToProfileCard(data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('profile_cards')
        .insert({ ...updateData, id: profile.id })
        .select()
        .single();

      if (error) throw new Error(`Failed to create profile: ${error.message}`);
      return dbProfileToProfileCard(data);
    }
  },

  // Group operations
  getGroupsForUser: async (userId: string): Promise<Group[]> => {
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('group_id')
      .eq('user_id', userId);

    if (membershipError) throw new Error(`Failed to get memberships: ${membershipError.message}`);
    if (!memberships || memberships.length === 0) return [];

    const groupIds = memberships.map(m => m.group_id);

    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError) throw new Error(`Failed to get groups: ${groupsError.message}`);
    return (groups || []).map(dbGroupToGroup);
  },

  createGroup: async (groupData: Omit<Group, 'id'>): Promise<Group> => {
    // Check for unique code
    const { data: existing } = await supabase
      .from('groups')
      .select('id')
      .eq('join_code', groupData.joinCode.toUpperCase())
      .single();

    if (existing) {
      throw new Error('Join code already in use');
    }

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        created_by_user_id: groupData.createdByUserId,
        is_public: groupData.isPublic,
        join_code: groupData.joinCode.toUpperCase(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create group: ${error.message}`);

    const newGroup = dbGroupToGroup(data);

    // Add creator to group
    await supabaseStorage.joinGroup(newGroup.id, groupData.createdByUserId);

    return newGroup;
  },

  updateGroup: async (groupId: string, data: Partial<Group>): Promise<Group> => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
    if (data.joinCode !== undefined) {
      // Check for unique code if changing
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('join_code', data.joinCode.toUpperCase())
        .neq('id', groupId)
        .single();

      if (existing) {
        throw new Error('Join code already in use');
      }
      updateData.join_code = data.joinCode.toUpperCase();
    }

    const { data: updated, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update group: ${error.message}`);
    if (!updated) throw new Error('Group not found');
    return dbGroupToGroup(updated);
  },

  joinGroup: async (groupId: string, userId: string): Promise<boolean> => {
    // Check if already a member
    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existing) return false;

    const { error } = await supabase
      .from('memberships')
      .insert({
        group_id: groupId,
        user_id: userId,
      });

    if (error) throw new Error(`Failed to join group: ${error.message}`);
    return true;
  },

  findGroupByCode: async (code: string): Promise<Group | undefined> => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('join_code', code.toUpperCase())
      .single();

    if (error || !data) return undefined;
    return dbGroupToGroup(data);
  },

  getGroupById: async (groupId: string): Promise<Group | undefined> => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error || !data) return undefined;
    return dbGroupToGroup(data);
  },

  searchPublicGroups: async (query: string): Promise<Group[]> => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('is_public', true)
      .ilike('name', `%${query}%`);

    if (error) throw new Error(`Failed to search groups: ${error.message}`);
    return (data || []).map(dbGroupToGroup);
  },

  getGroupMembers: async (groupId: string): Promise<User[]> => {
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('group_id', groupId);

    if (membershipError) throw new Error(`Failed to get memberships: ${membershipError.message}`);
    if (!memberships || memberships.length === 0) return [];

    const userIds = memberships.map(m => m.user_id);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (usersError) throw new Error(`Failed to get users: ${usersError.message}`);
    return (users || []).map(dbUserToUser);
  },

  inviteUsers: async (groupId: string, emails: string[]): Promise<void> => {
    const invitations = emails.map(email => ({
      group_id: groupId,
      email,
      invited_at: Date.now(),
    }));

    const { error } = await supabase
      .from('invitations')
      .insert(invitations);

    if (error) throw new Error(`Failed to invite users: ${error.message}`);
  },

  // Deck operations
  getDeckForGroup: async (groupId: string, viewerId: string): Promise<{ card: ProfileCard, status?: CardStatus }[]> => {
    // Get all members of the group except the viewer
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', viewerId);

    if (membershipError) throw new Error(`Failed to get memberships: ${membershipError.message}`);
    if (!memberships || memberships.length === 0) return [];

    const memberUserIds = memberships.map(m => m.user_id);

    // Get profile cards for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profile_cards')
      .select('*')
      .in('user_id', memberUserIds);

    if (profilesError) throw new Error(`Failed to get profiles: ${profilesError.message}`);
    if (!profiles || profiles.length === 0) return [];

    // Get card statuses for the viewer
    const { data: statuses, error: statusesError } = await supabase
      .from('card_statuses')
      .select('*')
      .eq('viewer_user_id', viewerId)
      .eq('group_id', groupId);

    if (statusesError) throw new Error(`Failed to get card statuses: ${statusesError.message}`);

    const statusMap = new Map(
      (statuses || []).map(s => [s.profile_card_id, dbCardStatusToCardStatus(s)])
    );

    return profiles.map(profile => ({
      card: dbProfileToProfileCard(profile),
      status: statusMap.get(profile.id),
    }));
  },

  markAsKnown: async (viewerId: string, cardId: string, groupId: string, isKnown: boolean): Promise<void> => {
    // Check if status exists
    const { data: existing } = await supabase
      .from('card_statuses')
      .select('id')
      .eq('viewer_user_id', viewerId)
      .eq('profile_card_id', cardId)
      .eq('group_id', groupId)
      .single();

    const statusData = {
      viewer_user_id: viewerId,
      profile_card_id: cardId,
      group_id: groupId,
      is_known: isKnown,
      last_reviewed_at: Date.now(),
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('card_statuses')
        .update(statusData)
        .eq('id', existing.id);

      if (error) throw new Error(`Failed to update card status: ${error.message}`);
    } else {
      // Insert new
      const { error } = await supabase
        .from('card_statuses')
        .insert(statusData);

      if (error) throw new Error(`Failed to create card status: ${error.message}`);
    }
  },

  resetGroupKnowledge: async (viewerId: string, groupId: string): Promise<void> => {
    const { error } = await supabase
      .from('card_statuses')
      .delete()
      .eq('viewer_user_id', viewerId)
      .eq('group_id', groupId);

    if (error) throw new Error(`Failed to reset group knowledge: ${error.message}`);
  },

  getGroupProgress: async (groupId: string, viewerId: string): Promise<number> => {
    const deck = await supabaseStorage.getDeckForGroup(groupId, viewerId);
    if (deck.length === 0) return 0;
    const knownCount = deck.filter(item => item.status?.isKnown).length;
    return Math.round((knownCount / deck.length) * 100);
  },

  getGroupRanking: async (groupId: string, viewerId: string): Promise<{ knownCount: number, topPercent: number }> => {
    // Get all members of the group
    const { data: memberships, error: membershipError } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('group_id', groupId);

    if (membershipError) throw new Error(`Failed to get memberships: ${membershipError.message}`);
    if (!memberships || memberships.length === 0) return { knownCount: 0, topPercent: 0 };

    const memberIds = memberships.map(m => m.user_id);

    // Calculate score for each member
    const scores = await Promise.all(
      memberIds.map(async (uid) => {
        const deck = await supabaseStorage.getDeckForGroup(groupId, uid);
        const knownCount = deck.filter(i => i.status?.isKnown).length;
        return { userId: uid, knownCount };
      })
    );

    // Sort descending
    scores.sort((a, b) => b.knownCount - a.knownCount);

    const rank = scores.findIndex(s => s.userId === viewerId) + 1;
    const myScore = scores.find(s => s.userId === viewerId)?.knownCount || 0;

    // Top X% (e.g. Rank 1 of 10 = Top 10%)
    const topPercent = Math.ceil((rank / memberIds.length) * 100);

    return { knownCount: myScore, topPercent };
  },

  getGlobalRanking: async (viewerId: string): Promise<{ totalKnown: number, topPercent: number }> => {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) throw new Error(`Failed to get users: ${usersError.message}`);
    if (!users || users.length === 0) return { totalKnown: 0, topPercent: 0 };

    // Get all card statuses
    const { data: statuses, error: statusesError } = await supabase
      .from('card_statuses')
      .select('viewer_user_id, is_known')
      .eq('is_known', true);

    if (statusesError) throw new Error(`Failed to get card statuses: ${statusesError.message}`);

    // Calculate score for each user
    const scores = users.map(u => {
      const knownCount = (statuses || []).filter(s => s.viewer_user_id === u.id).length;
      return { userId: u.id, knownCount };
    });

    // Sort descending
    scores.sort((a, b) => b.knownCount - a.knownCount);

    const rank = scores.findIndex(s => s.userId === viewerId) + 1;
    const myScore = scores.find(s => s.userId === viewerId)?.knownCount || 0;

    const topPercent = Math.ceil((rank / users.length) * 100);

    return { totalKnown: myScore, topPercent };
  },
};

