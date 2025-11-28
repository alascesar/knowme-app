import { User, Group, ProfileCard, Membership, CardStatus, UserType } from '../types';

// Keys for localStorage - Versioned to force fresh data load
const KEYS = {
  USERS: 'know-me-app_users_v4', // Bumped version to v4 to force new images
  GROUPS: 'know-me-app_groups_v4',
  PROFILES: 'know-me-app_profiles_v4',
  MEMBERSHIPS: 'know-me-app_memberships_v4',
  STATUSES: 'know-me-app_statuses_v4',
  CURRENT_USER: 'know-me-app_current_user_v4',
  INVITATIONS: 'know-me-app_invitations_v4',
};

// Helper to generate ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper for stable AI photos using randomuser.me (Reliable source)
const getAiPhoto = (gender: 'male' | 'female', idStr: string) => {
    // Generate a consistent number from the string id to pick a stable image
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    // randomuser.me has indices 0-99 for both genders
    const index = Math.abs(hash) % 99; 
    const genderPath = gender === 'male' ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${genderPath}/${index}.jpg`;
};

// Mock Data Initialization
const initializeData = () => {
  if (!localStorage.getItem(KEYS.USERS)) {
    // Basic Users
    const users: User[] = [
      { id: 'u1', name: 'Alice Wonder', email: 'alice@example.com', type: UserType.PREMIUM, avatarUrl: getAiPhoto('female', 'u1'), password: 'password' },
      { id: 'u2', name: 'Bob Builder', email: 'bob@example.com', type: UserType.STANDARD, avatarUrl: getAiPhoto('male', 'u2'), password: 'password' },
      { id: 'u3', name: 'Charlie Chef', email: 'charlie@example.com', type: UserType.STANDARD, avatarUrl: getAiPhoto('male', 'u3'), password: 'password' },
    ];
    
    // Groups
    const groups: Group[] = [
      { id: 'g1', name: 'Design Team', description: 'The creative folks.', createdByUserId: 'u1', isPublic: true, joinCode: 'DESIGN1' },
      { id: 'g_eng', name: 'Engineering', description: 'Building the core product.', createdByUserId: 'u1', isPublic: true, joinCode: 'ENG2024' },
      { id: 'g_sales', name: 'Sales Team', description: 'Global sales representatives.', createdByUserId: 'u1', isPublic: true, joinCode: 'SALES24' },
      { id: 'g_mkt', name: 'Marketing', description: 'Brand and outreach squad.', createdByUserId: 'u1', isPublic: true, joinCode: 'MKT2024' },
    ];

    // Memberships
    const memberships: Membership[] = [
      { id: 'm1', groupId: 'g1', userId: 'u1' },
      { id: 'm2', groupId: 'g1', userId: 'u2' },
      { id: 'm3', groupId: 'g1', userId: 'u3' },
      // Add Alice to new groups so she can demo them
      { id: 'm_alice_eng', groupId: 'g_eng', userId: 'u1' },
      { id: 'm_alice_sales', groupId: 'g_sales', userId: 'u1' },
      { id: 'm_alice_mkt', groupId: 'g_mkt', userId: 'u1' },
    ];

    // Profiles
    const profiles: ProfileCard[] = [
      { 
        id: 'p1', userId: 'u1', fullName: 'Alice Wonderland', 
        photoUrl: getAiPhoto('female', 'u1'), shortBio: 'Lead Designer with a passion for typography.', 
        nationality: 'UK', funFact: 'I have three cats named Hue, Saturation, and Value.', links: ['portfolio.com/alice']
      },
      { 
        id: 'p2', userId: 'u2', fullName: 'Robert Builder', 
        photoUrl: getAiPhoto('male', 'u2'), shortBio: 'Fixing things since 2010.', 
        nationality: 'USA', funFact: 'I can juggle 4 hammers.', links: []
      },
      { 
        id: 'p3', userId: 'u3', fullName: 'Charles Cooking', 
        photoUrl: getAiPhoto('male', 'u3'), shortBio: 'Making the office smell great every lunch.', 
        nationality: 'France', funFact: 'I once cooked for a minor celebrity.', links: []
      },
    ];

    // Generate 30 Test Users (10 per new group)
    // Explicitly typed to ensure gender is passed correctly
    const teams: { id: string; prefix: string; dept: string; users: { n: string; role: string; g: 'male' | 'female' }[] }[] = [
        { id: 'g_eng', prefix: 'eng', dept: 'Engineering', users: [
            { n: 'Sarah Jenkins', role: 'Frontend Dev', g: 'female' }, 
            { n: 'Mike Chen', role: 'Backend Lead', g: 'male' }, 
            { n: 'Jessica Wu', role: 'QA Engineer', g: 'female' },
            { n: 'David Miller', role: 'DevOps', g: 'male' }, 
            { n: 'Emily Davis', role: 'Product Manager', g: 'female' }, 
            { n: 'James Wilson', role: 'Full Stack', g: 'male' },
            { n: 'Robert Taylor', role: 'Mobile Dev', g: 'male' }, 
            { n: 'Linda Anderson', role: 'UX Research', g: 'female' }, 
            { n: 'William Thomas', role: 'System Arch', g: 'male' },
            { n: 'Elizabeth Martinez', role: 'Intern', g: 'female' }
        ]},
        { id: 'g_sales', prefix: 'sales', dept: 'Sales', users: [
            { n: 'John Smith', role: 'VP Sales', g: 'male' }, 
            { n: 'Karen White', role: 'Account Exec', g: 'female' }, 
            { n: 'Kevin Brown', role: 'SDR', g: 'male' },
            { n: 'Laura Garcia', role: 'Sales Ops', g: 'female' }, 
            { n: 'Steven Robinson', role: 'Regional Mgr', g: 'male' }, 
            { n: 'Patricia Clark', role: 'Account Mgr', g: 'female' },
            { n: 'Christopher Rodriguez', role: 'SDR Lead', g: 'male' }, 
            { n: 'Barbara Lewis', role: 'Customer Success', g: 'female' }, 
            { n: 'Daniel Lee', role: 'Solutions Eng', g: 'male' },
            { n: 'Paul Walker', role: 'Field Sales', g: 'male' }
        ]},
        { id: 'g_mkt', prefix: 'mkt', dept: 'Marketing', users: [
             { n: 'Jennifer Hall', role: 'CMO', g: 'female' }, 
             { n: 'Mark Allen', role: 'Brand Mgr', g: 'male' }, 
             { n: 'Maria Young', role: 'Content Lead', g: 'female' },
             { n: 'Charles King', role: 'SEO Specialist', g: 'male' }, 
             { n: 'Susan Wright', role: 'Events Coord', g: 'female' }, 
             { n: 'Joseph Scott', role: 'Social Media', g: 'male' },
             { n: 'Margaret Green', role: 'Designer', g: 'female' }, 
             { n: 'Thomas Baker', role: 'Copywriter', g: 'male' }, 
             { n: 'Nancy Adams', role: 'Analyst', g: 'female' }, 
             { n: 'Lisa Nelson', role: 'PR Manager', g: 'female' }
        ]}
    ];

    teams.forEach(team => {
        team.users.forEach((u, idx) => {
            const uid = `u_${team.prefix}_${idx}`;
            const pid = `p_${team.prefix}_${idx}`;
            
            const photo = getAiPhoto(u.g, uid);
            
            users.push({
                id: uid,
                name: u.n,
                email: `${u.n.split(' ')[0].toLowerCase()}@knowme.demo`,
                type: UserType.STANDARD,
                avatarUrl: photo,
                password: 'password'
            });

            memberships.push({
                id: `m_${team.prefix}_${idx}`,
                groupId: team.id,
                userId: uid
            });

            profiles.push({
                id: pid,
                userId: uid,
                fullName: u.n,
                photoUrl: photo,
                shortBio: `${u.role} at KnowMe Corp. Excited to be part of the ${team.dept} team!`,
                nationality: ['USA', 'UK', 'Canada', 'Spain', 'Germany', 'Australia'][Math.floor(Math.random() * 6)],
                funFact: 'I love trying new coffee spots and hiking on weekends.',
                links: []
            });
        });
    });

    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
    localStorage.setItem(KEYS.MEMBERSHIPS, JSON.stringify(memberships));
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(KEYS.STATUSES, JSON.stringify([]));
    localStorage.setItem(KEYS.INVITATIONS, JSON.stringify([]));
  }
};

initializeData();

// API Methods
export const storage = {
  // User
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },
  login: (email: string, password?: string): User | null => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email);
    if (user) {
      // Check password if provided
      if (password && user.password && user.password !== password) {
        return null;
      }
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },
  loginWithGoogle: (): { user: User, isNew: boolean } => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const googleEmail = 'alex.doe@gmail.com'; // Mock Google user
    let user = users.find(u => u.email === googleEmail);
    let isNew = false;

    if (!user) {
        // Create if doesn't exist (Simulate signup)
        isNew = true;
        const photo = getAiPhoto('male', 'alex_google');
        user = {
            id: generateId(),
            name: 'Alex Doe',
            email: googleEmail,
            type: UserType.STANDARD,
            avatarUrl: photo, 
            password: 'google-oauth-placeholder'
        };
        users.push(user);
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        
        // Create profile for them
        const profiles: ProfileCard[] = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '[]');
        profiles.push({
            id: generateId(),
            userId: user.id,
            fullName: user.name,
            photoUrl: photo,
            links: []
        });
        localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    }
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return { user, isNew };
  },
  signup: (name: string, email: string, type: UserType, password?: string): User => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    // Simple heuristic for gender based on name length for demo (evens female, odds male) just to vary it
    const gender = name.length % 2 === 0 ? 'female' : 'male';
    const photo = getAiPhoto(gender, name + Date.now());

    const newUser: User = {
      id: generateId(),
      name,
      email,
      type,
      avatarUrl: photo,
      password: password || 'password', // Default for MVP
    };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
    
    // Create empty profile card for new user
    const profiles: ProfileCard[] = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '[]');
    const newProfile: ProfileCard = {
        id: generateId(),
        userId: newUser.id,
        fullName: name,
        photoUrl: photo, // Placeholder
        links: []
    };
    profiles.push(newProfile);
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));

    return newUser;
  },
  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },
  updatePassword: (userId: string, newPassword: string) => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].password = newPassword;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        
        // Update current user session if needed
        const currentUser = storage.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            currentUser.password = newPassword;
            localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(currentUser));
        }
    }
  },

  // Profile
  getProfileByUserId: (userId: string): ProfileCard | undefined => {
    const profiles: ProfileCard[] = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '[]');
    return profiles.find(p => p.userId === userId);
  },
  updateProfile: (profile: ProfileCard) => {
    const profiles: ProfileCard[] = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '[]');
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
  },

  // Groups
  getGroupsForUser: (userId: string): Group[] => {
    const memberships: Membership[] = JSON.parse(localStorage.getItem(KEYS.MEMBERSHIPS) || '[]');
    const groups: Group[] = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
    const userGroupIds = memberships.filter(m => m.userId === userId).map(m => m.groupId);
    return groups.filter(g => userGroupIds.includes(g.id));
  },
  createGroup: (groupData: Omit<Group, 'id'>): Group => {
    const groups: Group[] = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
    
    // Check for unique code
    if (groups.some(g => g.joinCode.toUpperCase() === groupData.joinCode.toUpperCase())) {
        throw new Error("Join code already in use");
    }

    const newGroup: Group = { ...groupData, id: generateId() };
    groups.push(newGroup);
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
    
    // Add creator to group
    storage.joinGroup(newGroup.id, groupData.createdByUserId);
    return newGroup;
    
  },
  updateGroup: (groupId: string, data: Partial<Group>) => {
    const groups: Group[] = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
        groups[index] = { ...groups[index], ...data };
        localStorage.setItem(KEYS.GROUPS, JSON.stringify(groups));
        return groups[index];
    }
    throw new Error("Group not found");
  },
  joinGroup: (groupId: string, userId: string): boolean => {
    const memberships: Membership[] = JSON.parse(localStorage.getItem(KEYS.MEMBERSHIPS) || '[]');
    if (memberships.some(m => m.groupId === groupId && m.userId === userId)) return false;
    
    memberships.push({ id: generateId(), groupId, userId });
    localStorage.setItem(KEYS.MEMBERSHIPS, JSON.stringify(memberships));
    return true;
  },
  findGroupByCode: (code: string): Group | undefined => {
    const groups: Group[] = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
    return groups.find(g => g.joinCode === code);
  },
  getGroupById: (groupId: string): Group | undefined => {
    const groups: Group[] = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
    return groups.find(g => g.id === groupId);
  },
  searchPublicGroups: (query: string): Group[] => {
      const groups: Group[] = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]');
      return groups.filter(g => g.isPublic && g.name.toLowerCase().includes(query.toLowerCase()));
  },
  getGroupMembers: (groupId: string): User[] => {
      const memberships: Membership[] = JSON.parse(localStorage.getItem(KEYS.MEMBERSHIPS) || '[]');
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const memberIds = memberships.filter(m => m.groupId === groupId).map(m => m.userId);
      return users.filter(u => memberIds.includes(u.id));
  },
  inviteUsers: (groupId: string, emails: string[]) => {
      const invitations = JSON.parse(localStorage.getItem(KEYS.INVITATIONS) || '[]');
      emails.forEach(email => {
          invitations.push({ groupId, email, invitedAt: Date.now() });
      });
      localStorage.setItem(KEYS.INVITATIONS, JSON.stringify(invitations));
  },

  // Deck Logic
  getDeckForGroup: (groupId: string, viewerId: string): { card: ProfileCard, status?: CardStatus }[] => {
    const memberships: Membership[] = JSON.parse(localStorage.getItem(KEYS.MEMBERSHIPS) || '[]');
    const profiles: ProfileCard[] = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '[]');
    const statuses: CardStatus[] = JSON.parse(localStorage.getItem(KEYS.STATUSES) || '[]');

    const memberUserIds = memberships
        .filter(m => m.groupId === groupId && m.userId !== viewerId) // Exclude self
        .map(m => m.userId);

    const groupProfiles = profiles.filter(p => memberUserIds.includes(p.userId));

    return groupProfiles.map(card => {
        const status = statuses.find(s => s.profileCardId === card.id && s.viewerUserId === viewerId && s.groupId === groupId);
        return { card, status };
    });
  },
  markAsKnown: (viewerId: string, cardId: string, groupId: string, isKnown: boolean) => {
      const statuses: CardStatus[] = JSON.parse(localStorage.getItem(KEYS.STATUSES) || '[]');
      const existingIndex = statuses.findIndex(s => s.viewerUserId === viewerId && s.profileCardId === cardId && s.groupId === groupId);
      
      const newStatus: CardStatus = {
          id: existingIndex !== -1 ? statuses[existingIndex].id : generateId(),
          viewerUserId: viewerId,
          profileCardId: cardId,
          groupId,
          isKnown,
          lastReviewedAt: Date.now()
      };

      if (existingIndex !== -1) {
          statuses[existingIndex] = newStatus;
      } else {
          statuses.push(newStatus);
      }
      localStorage.setItem(KEYS.STATUSES, JSON.stringify(statuses));
  },
  resetGroupKnowledge: (viewerId: string, groupId: string) => {
      const statuses: CardStatus[] = JSON.parse(localStorage.getItem(KEYS.STATUSES) || '[]');
      // Filter out statuses for this user and group, effectively resetting them to unknown
      const newStatuses = statuses.filter(s => !(s.viewerUserId === viewerId && s.groupId === groupId));
      localStorage.setItem(KEYS.STATUSES, JSON.stringify(newStatuses));
  },
  getAllKnownProfiles: (viewerId: string): ProfileCard[] => {
      const statuses: CardStatus[] = JSON.parse(localStorage.getItem(KEYS.STATUSES) || '[]');
      const profiles: ProfileCard[] = JSON.parse(localStorage.getItem(KEYS.PROFILES) || '[]');
      
      const knownProfileIds = statuses
          .filter(s => s.viewerUserId === viewerId && s.isKnown)
          .map(s => s.profileCardId);
      
      // Use Set to avoid duplicates if user is in multiple groups with same person
      const uniqueIds = Array.from(new Set(knownProfileIds));
      
      return profiles.filter(p => uniqueIds.includes(p.id));
  },
  getGroupProgress: (groupId: string, viewerId: string): number => {
      const deck = storage.getDeckForGroup(groupId, viewerId);
      if (deck.length === 0) return 0;
      const knownCount = deck.filter(item => item.status?.isKnown).length;
      return Math.round((knownCount / deck.length) * 100);
  },
  getGroupRanking: (groupId: string, viewerId: string): { knownCount: number, topPercent: number } => {
      const memberships = JSON.parse(localStorage.getItem(KEYS.MEMBERSHIPS) || '[]');
      const memberIds = memberships.filter((m: any) => m.groupId === groupId).map((m: any) => m.userId);
      
      if (memberIds.length === 0) return { knownCount: 0, topPercent: 0 };

      // Calculate score for each member
      const scores = memberIds.map((uid: string) => {
          const deck = storage.getDeckForGroup(groupId, uid);
          const knownCount = deck.filter(i => i.status && i.status.isKnown).length;
          return { userId: uid, knownCount };
      });

      // Sort descending
      scores.sort((a: any, b: any) => b.knownCount - a.knownCount);

      const rank = scores.findIndex((s: any) => s.userId === viewerId) + 1;
      const myScore = scores.find((s: any) => s.userId === viewerId)?.knownCount || 0;
      
      // Top X% (e.g. Rank 1 of 10 = Top 10%)
      const topPercent = Math.ceil((rank / memberIds.length) * 100);

      return { knownCount: myScore, topPercent };
  },
  getGlobalRanking: (viewerId: string): { totalKnown: number, topPercent: number } => {
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const statuses: CardStatus[] = JSON.parse(localStorage.getItem(KEYS.STATUSES) || '[]');
      
      if (users.length === 0) return { totalKnown: 0, topPercent: 0 };

      // Calculate score for each user in the system
      const scores = users.map(u => {
          const knownCount = statuses.filter(s => s.viewerUserId === u.id && s.isKnown).length;
          return { userId: u.id, knownCount };
      });

      // Sort descending
      scores.sort((a: any, b: any) => b.knownCount - a.knownCount);

      const rank = scores.findIndex((s: any) => s.userId === viewerId) + 1;
      const myScore = scores.find((s: any) => s.userId === viewerId)?.knownCount || 0;
      
      const topPercent = Math.ceil((rank / users.length) * 100);

      return { totalKnown: myScore, topPercent };
  }
};