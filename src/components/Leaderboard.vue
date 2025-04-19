<template>
    <div class="leaderboard">
      <!-- Header component -->
      <AppHeader 
        :username="user?.username || 'User'" 
        @logout="logout" 
      />
  
      <!-- Main Content -->
      <main class="leaderboard-main">
        <div class="container">
          <section class="hero-section">
            <h2>Community Leaderboard</h2>
            <p>See how your environmental efforts stack up against the community.</p>
          </section>
  
          <!-- Leaderboard Controls -->
          <section class="leaderboard-controls">
            <div class="controls-wrapper">
              <div class="search-box">
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  v-model="searchQuery"
                  @input="filterLeaderboard"
                >
              </div>
              
            </div>
          </section>
  
          <!-- Top 3 Users Podium -->
          <section class="top-users-podium" v-if="!loading && filteredLeaderboard.length > 0">
            <div class="podium-wrapper">
              <!-- Second Place -->
              <div class="podium-user second-place" v-if="filteredLeaderboard.length > 1">
                <div class="placement">2</div>
                <div class="avatar">
                  <img :src="filteredLeaderboard[1].avatar" :alt="filteredLeaderboard[1].username">
                  <div class="position-badge silver">2</div>
                </div>
                <div class="user-info">
                  <h3>{{ filteredLeaderboard[1].username }}</h3>
                  <div class="points">{{ filteredLeaderboard[1].points }} pts</div>
                  <div class="badges" v-if="filteredLeaderboard[1].badgeDetails?.length">
  <span v-for="badge in filteredLeaderboard[1].badgeDetails.slice(0, 2)" :key="badge.icon" class="badge" :title="badge.name">
    {{ badge.icon }}
    <span class="badge-name">{{ badge.name }}</span>
  </span>
</div>
                </div>
              </div>
  
              <!-- First Place -->
              <div class="podium-user first-place" v-if="filteredLeaderboard.length > 0">
                <div class="placement">1</div>
                <div class="avatar">
                  <img :src="filteredLeaderboard[0].avatar" :alt="filteredLeaderboard[0].username">
                  <div class="position-badge gold">1</div>
                </div>
                <div class="user-info">
                  <h3>{{ filteredLeaderboard[0].username }}</h3>
                  <div class="points">{{ filteredLeaderboard[0].points }} pts</div>
                  <div class="badges" v-if="filteredLeaderboard[0].badgeDetails?.length">
  <span v-for="badge in filteredLeaderboard[0].badgeDetails.slice(0, 3)" :key="badge.icon" class="badge" :title="badge.name">
    {{ badge.icon }}
    <span class="badge-name">{{ badge.name }}</span>
  </span>
</div>
                </div>
                <div class="crown">👑</div>
              </div>
  
              <!-- Third Place -->
              <div class="podium-user third-place" v-if="filteredLeaderboard.length > 2">
                <div class="placement">3</div>
                <div class="avatar">
                  <img :src="filteredLeaderboard[2].avatar" :alt="filteredLeaderboard[2].username">
                  <div class="position-badge bronze">3</div>
                </div>
                <div class="user-info">
                  <h3>{{ filteredLeaderboard[2].username }}</h3>
                  <div class="points">{{ filteredLeaderboard[2].points }} pts</div>
                  <div class="badges" v-if="filteredLeaderboard[2].badgeDetails?.length">
  <span v-for="badge in filteredLeaderboard[2].badgeDetails.slice(0, 2)" :key="badge.icon" class="badge" :title="badge.name">
    {{ badge.icon }}
    <span class="badge-name">{{ badge.name }}</span>
  </span>
</div>
                </div>
              </div>
            </div>
          </section>
  
          <!-- Leaderboard Table -->
          <section class="leaderboard-table">
            <div v-if="loading" class="loading">
              <span class="loading-spinner"></span>
              <p>Loading leaderboard...</p>
            </div>
            
            <div v-else-if="error" class="error-message">
              <p>{{ error }}</p>
              <button @click="fetchLeaderboard" class="retry-btn">Try Again</button>
            </div>
            
            <div v-else-if="filteredLeaderboard.length === 0" class="no-results">
              <div class="no-results-icon">🏆</div>
              <h3>No users found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
            
            <div v-else class="table-container">
                <table class="rankings-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Achievements</th>
            <th>Points</th>
            <th>Carbon Saved</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(user, index) in filteredLeaderboard" 
            :key="user.id"
            :class="{
              'current-user': user.id === currentUserId,
              'rank-1': index === 0,
              'rank-2': index === 1,
              'rank-3': index === 2
            }"
          >
            <td class="rank">{{ index + 1 }}</td>
            <td class="user-cell">
              <div class="user-avatar">
                <img :src="user.avatar" :alt="user.username">
              </div>
              <span class="username">{{ user.username }}</span>
            </td>
            <td class="badges-cell">
              <div class="badges">
                <span v-for="badge in user.badgeDetails?.slice(0, 3)" :key="badge.icon" class="badge" :title="badge.name">
      {{ badge.icon }}
      <span class="badge-name">{{ badge.name }}</span>
    </span>
    <span 
      v-if="user.badgeDetails && user.badgeDetails.length > 3" 
      class="badge more"
      :title="getHiddenBadgeNames(user.badgeDetails.slice(3))"
    >
      +{{ user.badgeDetails.length - 3 }}
      <div class="badge-tooltip">
        <div v-for="badge in user.badgeDetails.slice(3)" :key="badge.icon" class="tooltip-badge">
          <span class="tooltip-icon">{{ badge.icon }}</span>
          <span class="tooltip-name">{{ badge.name }}</span>
        </div>
      </div>
    </span>
              </div>
            </td>
            <td class="points-cell">{{ user.points }}</td>
            <td class="carbon-cell">{{ user.carbonSaved }}kg</td>
          </tr>
        </tbody>
      </table>
            </div>
          </section>
          
          <section class="your-impact" v-if="userRank">
  <div class="impact-card">
    <div class="impact-header">
      <h3>Your Leaderboard Position</h3>
    </div>
    
    <!-- Show this if user is hidden from leaderboard -->
    <div v-if="userRank.hideFromLeaderboard" class="hidden-leaderboard-message">
      <p>You're currently hidden from the public leaderboard.</p>
      <p>Your stats are still being tracked, but won't appear to others.</p>
      <button @click="navigateToSettings" class="settings-btn">Manage Visibility Settings</button>
    </div>
    
    <!-- Show regular stats if user is visible on leaderboard -->
    <div v-else>
      <div class="impact-stats">
        <div class="stat">
          <div class="stat-value">{{ userRank.rank }}</div>
          <div class="stat-label">Current Rank</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ userRank.points }}</div>
          <div class="stat-label">Total Points</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ userRank.carbonSaved }}kg</div>
          <div class="stat-label">CO₂ Saved</div>
        </div>
      </div>
      <div class="impact-progress">
        <p>{{ nextRankMessage }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="`width: ${progressToNextRank}%`"></div>
        </div>
      </div>
    </div>
  </div>
</section>
        </div>
      </main>
  
      <!-- Footer component -->
      <AppFooter />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import AppHeader from '../views/Header.vue'
  import AppFooter from '../views/Footer.vue'
  import axios from 'axios'
  
  interface User {
    username: string;
    [key: string]: any;
  }
  
  interface LeaderboardUser {
    id: number;
    username: string;
    avatar: string;
    points: number;
    carbonSaved: number;
    badges: string[];
    badgeDetails?: { icon: string; name: string }[];
    activities: {
      challenges: number;
      recycling: number;
      carbon: number;
    }
  }
  
  interface UserRank {
    rank: number;
    points: number;
    carbonSaved: number;
    pointsToNextRank: number;
    hideFromLeaderboard?: boolean;
  }
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const user = computed<User | null>(() => authStore.user as User | null)
  const currentUserId = computed(() => user.value?.id || -1)
  const leaderboard = ref<LeaderboardUser[]>([])
  const filteredLeaderboard = ref<LeaderboardUser[]>([])
  const loading = ref(true)
  const error = ref('')
  
  // Filter and search state
  const searchQuery = ref('')
  const timeFilter = ref('monthly')
  const activityFilter = ref('all')
  
  // User's rank information
  const userRank = ref<UserRank | null>(null)
  
  const badgeInfo = ref<Record<string, {name: string, shortName: string}>>({});
  
  const nextRankMessage = computed(() => {
    if (!userRank.value) return 'Loading your rank data...';
    
    if (userRank.value.rank === 1) {
      return 'Congratulations! You are #1 on the leaderboard!';
    } else if (userRank.value.pointsToNextRank > 0) {
      return `${userRank.value.pointsToNextRank} more points to rank ${userRank.value.rank - 1}`;
    } else {
      return 'Keep going to improve your rank!';
    }
  });
  
  const progressToNextRank = computed(() => {
    if (!userRank.value || userRank.value.rank === 1) return 100;
    
    const pointsNeeded = userRank.value.pointsToNextRank;
    
    // If points needed is 0 or negative, show full progress
    if (pointsNeeded <= 0) return 100;
    
    const lastRankPoints = userRank.value.points || 0;
    const nextRankPoints = lastRankPoints + pointsNeeded;
    
    const totalPointsNeeded = nextRankPoints - lastRankPoints;
    // Avoid division by zero
    if (totalPointsNeeded <= 0) return 100;
    
    const progress = ((totalPointsNeeded - pointsNeeded) / totalPointsNeeded) * 100;
    return Math.min(Math.max(progress, 0), 100);
  });
  
  const fetchLeaderboard = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // Build the query parameters
    const params = new URLSearchParams();
    if (timeFilter.value !== 'all') {
      params.append('timeFilter', timeFilter.value);
    }
    if (activityFilter.value !== 'all') {
      params.append('activityFilter', activityFilter.value);
    }
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }
    

    
    // Fetch leaderboard data from API
    const response = await axios.get(`/api/leaderboard?${params.toString()}`, getAuthHeader());
    
    // Log the received data

    
    // Ensure all numerical values are properly converted
    leaderboard.value = response.data.map((user: any) => ({
      ...user,
      points: Number(user.points),
      carbonSaved: user.carbonSaved
    }));
    
    // Apply the filter to the data we just fetched
    filterLeaderboard();
    
    // Fetch current user's rank information
    await fetchUserRank();
    
    loading.value = false;
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    error.value = err instanceof Error ? err.message : 'An error occurred while fetching the leaderboard';
    loading.value = false;
  }
};

const fetchUserRank = async () => {
  try {

    const response = await axios.get('/api/leaderboard/user-rank', getAuthHeader());

    
    // Check if the user has disabled appearing on leaderboard
    if (response.data.hideFromLeaderboard) {
      userRank.value = {
        rank: Number(response.data.rank),
        points: Number(response.data.points),
        carbonSaved: response.data.carbonSaved,
        pointsToNextRank: Number(response.data.pointsToNextRank),
        hideFromLeaderboard: true
      };
      
      // Add a message to the user that they're hidden from the leaderboard
      console.log('User has chosen to be hidden from the leaderboard');
    } else {
      // Ensure numerical properties are properly converted
      userRank.value = {
        rank: Number(response.data.rank),
        points: Number(response.data.points),
        carbonSaved: response.data.carbonSaved,
        pointsToNextRank: Number(response.data.pointsToNextRank),
        hideFromLeaderboard: false
      };
    }
    
    // Check if we got valid data
    if (!userRank.value || typeof userRank.value.rank !== 'number') {
      console.error('Invalid user rank data received:', userRank.value);
      error.value = 'Error: Could not retrieve your leaderboard position';
    }
  } catch (err) {
    console.error('Error fetching user rank:', err);
    error.value = 'Unable to load your leaderboard position';
  }
};

const getHiddenBadgeNames = (badges: { icon: string; name: string; }[]) => {
  return badges.map(badge => `${badge.icon} ${badge.name}`).join('\n');
};
  
  const filterLeaderboard = () => {
    // Apply search query filter
    if (searchQuery.value) {
      filteredLeaderboard.value = leaderboard.value.filter(user => {
        return user.username.toLowerCase().includes(searchQuery.value.toLowerCase());
      });
    } else {
      filteredLeaderboard.value = leaderboard.value;
    }
  };
  
  const getAuthHeader = () => {
    return {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    };
  };

  const navigateToSettings = () => {
  router.push('/settings?tab=settings&section=privacy');
};
  
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }

const loadBadgeInfo = async () => {
  try {
    // Fetch all badges to build the mapping
    const response = await axios.get('/api/badges/all-badges', getAuthHeader());
    const badges = response.data;
    
    
    // Build the badge info mapping using icon as key
    const badgeMap: Record<string, {name: string, shortName: string}> = {};
    badges.forEach((badge: any) => {
      if (badge.icon) {
        // For short name, use the first word or first 10 chars if no space
        const shortName = badge.name.split(' ')[0] || 
                          badge.name.substring(0, 10);
                          
        badgeMap[badge.icon] = {
          name: badge.name,
          shortName: shortName
        };
      }
    });
    
    
    badgeInfo.value = badgeMap;
  } catch (error) {
    console.error('Error loading badge information:', error);
  }
};

const getBadgeName = (badgeIcon: string) => {
  console.log(`Getting name for badge icon: ${badgeIcon}`); // Log the icon we're trying to find
  
  // Use dynamically loaded data from the database
  if (badgeInfo.value[badgeIcon]) {
    console.log(`Found badge name: ${badgeInfo.value[badgeIcon].name}`); // Log the name we found
    return badgeInfo.value[badgeIcon].name;
  }
  
  console.log(`Badge icon not found in mapping: ${badgeIcon}`); // Log when an icon isn't found
  // If badge not found in our data, just return a generic label
  return 'Achievement';
};

const getBadgeShortName = (badgeIcon: string) => {
  // Use dynamically loaded data from the database
  if (badgeInfo.value[badgeIcon]) {
    return badgeInfo.value[badgeIcon].shortName;
  }
  
  // If badge not found in our data, just return the icon itself
  return badgeIcon;
};
  
  onMounted(() => {
    fetchLeaderboard();
    loadBadgeInfo();
  })
  </script>
  
  <style scoped>
  /* Base styles */
  .leaderboard {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
  }
  
  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .leaderboard-main {
    flex: 1;
    padding: 30px 0;
  }
  
  /* Hero section */
  .hero-section {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .hero-section h2 {
    font-size: 2rem;
    margin-bottom: 10px;
    color: #2E7D32;
  }
  
  .hero-section p {
    font-size: 1.1rem;
    color: #555;
    max-width: 700px;
    margin: 0 auto;
  }
  
  /* Leaderboard controls */
  .leaderboard-controls {
    margin-bottom: 30px;
  }
  
  .controls-wrapper {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    background: linear-gradient(to right, #e8f5e9, #f1f8e9);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(76, 175, 80, 0.2);
    width: 100%;
    box-sizing: border-box;
    align-items: center; /* Center align items vertically */
  }
  
  .search-box {
    flex: 1;
    min-width: 200px; /* Reduce from 250px to allow more space */
    max-width: 100%;
    position: relative;
    box-sizing: border-box;
  }
  
  .search-box::before {
    content: '🔍';
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #66BB6A;
    font-size: 1rem;
  }
    
  .search-box input {
    width: 100%;
    padding: 12px 15px 12px 38px;
    border: 1px solid #c8e6c9;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background-color: white;
    color: #333;
    box-sizing: border-box;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
  
  .filter-dropdown {
    min-width: 180px;
    position: relative;
  }
  
  .filter-dropdown::after {
    content: '▼';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #66BB6A;
    font-size: 0.7rem;
    pointer-events: none;
  }
    
  .filter-dropdown select {
    width: 100%;
    padding: 12px 15px;
    padding-right: 30px;
    border: 1px solid #c8e6c9;
    border-radius: 8px;
    background-color: white;
    font-size: 1rem;
    appearance: none;
    transition: all 0.3s ease;
    cursor: pointer;
    color: #333;
  }
  
  .filter-dropdown select:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
  
  /* Medium-size screen specific fixes */
  @media (min-width: 769px) and (max-width: 940px) {
    .controls-wrapper {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    
    .search-box {
      flex: 0 0 100%; /* Take full width on first row */
      margin-bottom: 10px;
    }
  }
  
  /* Small tablets */
  @media (min-width: 481px) and (max-width: 768px) {
    .controls-wrapper {
      padding: 15px;
    }
    
    .search-box {
      flex: 0 0 100%;
    }
  }
  
  /* Top Users Podium */
  .top-users-podium {
    margin-bottom: 40px;
  }
  
  .podium-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 20px;
    padding: 20px 0;
    position: relative;
  }
  
  .podium-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 180px;
  z-index: 1;
  height: auto !important; /* Override fixed heights */
  min-height: 220px; /* Use min-height instead of fixed height */
}
  
.first-place {
  background: linear-gradient(135deg, #fff9c4, #ffecb3);
  min-height: 280px; /* Use min-height instead of height */
  border: 2px solid #FFC107;
  z-index: 3;
}

.second-place {
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  min-height: 240px; /* Use min-height instead of height */
  border: 2px solid #9E9E9E;
  z-index: 2;
}

.third-place {
  background: linear-gradient(135deg, #ffe0b2, #ffccbc);
  min-height: 220px; /* Use min-height instead of height */
  border: 2px solid #FF9800;
  z-index: 2;
}
  
  .placement {
    position: absolute;
    width: 100%;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  }
  
  .first-place .placement {
    background-color: #FFC107;
  }
  
  .second-place .placement {
    background-color: #9E9E9E;
  }
  
  .third-place .placement {
    background-color: #FF9800;
  }

  /* CSS for the tooltip */
.badge.more {
  position: relative;
  cursor: default;
}

.badge-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 10px;
  width: 200px;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  pointer-events: none;
  border: 1px solid #e0e0e0;
  margin-bottom: 10px;
}

.badge.more:hover .badge-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.tooltip-badge:last-child {
  border-bottom: none;
}

.tooltip-icon {
  font-size: 1rem;
}

.tooltip-name {
  font-size: 0.8rem;
  color: #333;
}
  
  /* Add better badge container styling for podium */
.podium-user .badges {
  margin-top: auto; /* Push badges to bottom with flex space */
  width: 100%;
  max-height: 80px; /* Limit height of badges section */
  overflow-y: auto; /* Add scrolling if too many badges */
  margin-bottom: 5px;
  padding-top: 5px;
}

/* Make badge text smaller in podium */
.podium-user .badge-name {
  font-size: 0.7rem;
  max-width: 100px; /* Limit text width */
}

/* Update podium badge styling */
.podium-user .badge {
  padding: 3px 6px;
  font-size: 0.8rem;
}

  .avatar {
    position: relative;
    margin-bottom: 15px;
  }
  
  .avatar img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
  
  .first-place .avatar img {
    width: 100px;
    height: 100px;
  }
  
  .position-badge {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    border: 2px solid white;
  }
  
  .gold {
    background-color: #FFC107;
  }
  
  .silver {
    background-color: #9E9E9E;
  }
  
  .bronze {
    background-color: #FF9800;
  }
  
  .user-info {
    text-align: center;
    width: 100%;
  }
  
  .user-info h3 {
    font-size: 1rem;
    margin: 5px 0;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .first-place h3 {
    font-size: 1.2rem;
    color: #5D4037;
  }
  
  .points {
    font-weight: bold;
    color: #2E7D32;
    margin-bottom: 10px;
  }
  
  .first-place .points {
    font-size: 1.1rem;
    color: #F57F17;
  }
  
  .badges {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 10px;
    background-color: rgba(76, 175, 80, 0.1);
    color: #2E7D32;
    font-size: 0.85rem;
  }
  
  .badge-name {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  
  .badge.more {
    background-color: rgba(0, 0, 0, 0.05);
    color: #555;
    justify-content: center;
  }
  
  .crown {
    position: absolute;
    top: -20px;
    font-size: 2rem;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  }
  
  /* Leaderboard table */
  .leaderboard-table {
    margin-bottom: 40px;
  }
  
  .table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  
  .rankings-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .rankings-table th, .rankings-table td {
    padding: 15px;
    text-align: left;
  }

  /* Update the table badges styling to be horizontal with scrolling */
.rankings-table .badges {
  display: flex;
  flex-direction: row; /* Change to row for horizontal display */
  flex-wrap: nowrap; /* Prevent wrapping to new lines */
  gap: 8px;
  overflow-x: auto; /* Enable horizontal scrolling */
  padding: 4px 0;
  max-width: 100%; /* Ensure it doesn't overflow the cell */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #4CAF50 #e8f5e9; /* Firefox */
}

/* Style the scrollbar for WebKit browsers */
.rankings-table .badges::-webkit-scrollbar {
  height: 4px;
}

.rankings-table .badges::-webkit-scrollbar-track {
  background: #e8f5e9;
  border-radius: 10px;
}

.rankings-table .badges::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 10px;
}

/* Make sure podium badges remain vertical */
.podium-user .badges {
  flex-direction: column; /* Keep podium badges vertical */
  overflow-x: hidden; /* No horizontal scroll for podium badges */
  overflow-y: auto; /* Vertical scroll if needed */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #4CAF50 #e8f5e9; /* Firefox */
}

/* Update badge display in table */
.rankings-table .badge {
  flex-shrink: 0; /* Prevent badges from shrinking */
  white-space: nowrap; /* Keep text on one line */
}

/* Adjust badge name width in table */
.rankings-table .badge-name {
  max-width: 100px; /* Limit the width of badge names */
}
  
  .rankings-table th {
    background-color: #e8f5e9;
    color: #2E7D32;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
  }
  
  .rankings-table th:nth-child(3) {
    text-align: center;
  }
  
  .rankings-table tr:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
  
  .rankings-table tr:hover {
    background-color: #f9f9f9;
  }
  
  .current-user {
    background-color: #e8f5e9;
  }
  
  .rank {
    font-weight: bold;
    font-size: 1.1rem;
    color: #555;
    text-align: center;
    width: 60px;
  }
  
  .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: 50%;
  }
  
  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .username {
    font-weight: 500;
  }
  
  .badges-cell {
    max-width: 250px;
  }
  
  .points-cell {
    font-weight: bold;
    color: #2E7D32;
  }
  
  .carbon-cell {
    font-weight: 500;
    color: #0277BD;
  }
  
  /* Your impact card */
  .your-impact {
    margin-bottom: 40px;
  }
  
  .impact-card {
    background: linear-gradient(135deg, #f9f9f9, #e8f5e9);
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    border-left: 6px solid #4CAF50;
    margin-bottom: 8rem;
  }
  
  .impact-header h3 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: #2E7D32;
    text-align: center;
  }
  
  .impact-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30px;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2E7D32;
    margin-bottom: 5px;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #555;
  }
  
  .impact-progress {
    text-align: center;
  }
  
  .impact-progress p {
    margin-bottom: 10px;
    font-weight: 500;
    color: #555;
  }
  
  .progress-bar {
    height: 12px;
    background-color: #E0E0E0;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #43A047, #66BB6A);
    border-radius: 10px;
    transition: width 1s ease;
  }
  
  /* Loading and error states */
  .loading, .error-message, .no-results {
    text-align: center;
    padding: 40px 20px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    margin-bottom: 30px;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid rgba(76, 175, 80, 0.2);
    border-radius: 50%;
    border-top-color: #4CAF50;
    animation: spin 1s ease infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .loading p, .error-message p {
    margin-top: 15px;
    color: #666;
  }
  
  .retry-btn {
    margin-top: 15px;
    padding: 8px 20px;
    background-color: #43A047;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .no-results-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.7;
  }

  /* Add this new styling for the settings button */
  .settings-btn {
    margin-top: 15px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .settings-btn:hover {
    background-color: #388E3C;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  .settings-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
  }

  /* Style the hidden leaderboard message section */
  .hidden-leaderboard-message {
    padding: 15px 20px;
    border-radius: 8px;
    margin: 15px 0;
    text-align: center;
  }

  .hidden-leaderboard-message p {
    margin-bottom: 10px;
    color: #555;
  }
  
  /* Add styling for top 3 ranks in the table */
  .rank-1 {
    background: linear-gradient(to right, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.03)) !important;
    border-left: 4px solid #FFC107;
  }

  .rank-2 {
    background: linear-gradient(to right, rgba(192, 192, 192, 0.1), rgba(192, 192, 192, 0.03)) !important;
    border-left: 4px solid #9E9E9E;
  }

  .rank-3 {
    background: linear-gradient(to right, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.03)) !important;
    border-left: 4px solid #FF9800;
  }

  .rank-1 .rank, .rank-2 .rank, .rank-3 .rank {
    font-weight: 700;
    font-size: 1.2rem;
  }

  .rank-1 .rank {
    color: #FFC107;
  }

  .rank-2 .rank {
    color: #9E9E9E;
  }

  .rank-3 .rank {
    color: #FF9800;
  }

  /* Override for when user is both top rank and current user */
  .rank-1.current-user, .rank-2.current-user, .rank-3.current-user {
    background: linear-gradient(to right, #e8f5e9, rgba(232, 245, 233, 0.5)) !important;
  }

  /* Responsive adjustments */
  @media (max-width: 940px) {
    .podium-wrapper {
      flex-direction: row;
      align-items: center;
    }
    
    .podium-user {
      height: auto !important;
      width: 100%;
      max-width: 300px;
    }
    
    .first-place {
      order: 1;
    }
    
    .second-place {
      order: 2;
    }
    
    .third-place {
      order: 3;
    }
  }
  
  @media (max-width: 768px) {
    .controls-wrapper {
      padding: 15px;
      flex-direction: column;
      align-items: stretch; /* Stretch items to full width */
    }
    
    .search-box {
      width: 100%;
      min-width: 100%; /* Force full width on mobile */
    }
    
    .search-box input {
      width: 100%;
      box-sizing: border-box;
    }
    
    .impact-stats {
      flex-direction: column;
      gap: 20px;
    }
    
    .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
      scrollbar-width: none; /* Hide scrollbar on Firefox */
    }
    
    .table-container::-webkit-scrollbar {
      display: none; /* Hide scrollbar on Chrome/Safari */
    }
    
    .rankings-table {
      min-width: 100%; /* Change from fixed 650px to responsive */
      font-size: 0.9rem; /* Slightly smaller text on mobile */
    }
    
    .rankings-table th, 
    .rankings-table td {
      padding: 10px 8px; /* Reduce padding to fit more content */
    }
    
    .current-user {
      background-color: #e8f5e9;
      border-left: 3px solid #4CAF50; /* Make current user row more prominent on mobile */
    }

    /* Mobile badge improvements */
    .rankings-table .badges {
      padding: 6px 0;
      overflow-x: visible; /* Change to visible to prevent scrolling on mobile */
      flex-wrap: wrap; /* Allow badges to wrap on smaller screens */
      gap: 5px; /* Tighter spacing */
      justify-content: flex-start;
    }
    
    .rankings-table .badge {
      padding: 3px 5px; /* Smaller padding */
      min-width: 0; /* Allow badges to shrink */
      max-width: 100%; /* Ensure badges don't overflow */
    }
    
    .badges-cell {
      min-width: 120px; /* Ensure cell is wide enough */
      max-width: none; /* Remove max width constraint on mobile */
    }
  }
  
  @media (max-width: 480px) {
    .rankings-table th:nth-child(5),
    .rankings-table td:nth-child(5) {
      display: none; /* Hide carbon saved column on very small screens */
    }
    
    .badge-name {
      max-width: 70px; /* Make badge names shorter on small screens */
    }
    
    .rank {
      width: 40px; /* Smaller rank column */
    }
    
    .user-avatar {
      width: 30px;
      height: 30px;
    }
    
    /* Make badge tooltip appear to the side instead of above on mobile */
    .badge-tooltip {
      bottom: 0;
      left: 100%;
      transform: translateX(0);
      margin-bottom: 0;
      margin-left: 10px;
      width: 160px;
    }

    /* Specific adjustments for very small screens */
    .rankings-table .badge-name {
      max-width: 60px; /* Shorter badge names on small screens */
      font-size: 0.7rem; /* Smaller text */
    }
    
    .rankings-table .badge {
      font-size: 0.8rem; /* Slightly smaller badge text */
    }
    
    /* Make sure the 3 badges fit without horizontal scrolling */
    .rankings-table .badges {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      width: 100%;
    }
  }

  /* Enhanced mobile styles for devices under 600px width */
@media (max-width: 600px) {
  /* Improve hero section */
  .hero-section h2 {
    font-size: 1.5rem;
  }
  
  .hero-section p {
    font-size: 0.9rem;
  }
  
  /* Better podium layout for small screens */
  .podium-wrapper {
    flex-direction: column !important;
    padding: 10px 0;
  }
  
  .podium-user {
    width: 100%;
    max-width: 250px;
    min-height: auto;
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .first-place {
    order: 1;
    min-height: 200px;
  }
  
  .second-place {
    order: 2;
    min-height: 180px;
  }
  
  .third-place {
    order: 3;
    min-height: 180px;
  }
  
  .podium-user .avatar img {
    width: 60px;
    height: 60px;
  }
  
  .first-place .avatar img {
    width: 70px;
    height: 70px;
  }
  
  /* Streamlined table display */
  .rankings-table {
    font-size: 0.8rem;
  }
  
  .rankings-table th, 
  .rankings-table td {
    padding: 8px 5px;
  }
  
  /* Hide multiple columns on very small screens */
  .rankings-table th:nth-child(3),
  .rankings-table td:nth-child(3),
  .rankings-table th:nth-child(5),
  .rankings-table td:nth-child(5) {
    display: none;
  }
  
  /* Make the User cell simpler */
  .user-cell {
    gap: 8px;
  }
  
  .user-avatar {
    width: 25px;
    height: 25px;
  }
  
  .username {
    font-size: 0.9rem;
    max-width: 90px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Simplified user impact card */
  .impact-card {
    padding: 15px;
    margin-bottom: 6rem;
  }
  
  .impact-header h3 {
    font-size: 1.2rem;
  }
  
  .stat-value {
    font-size: 1.6rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .impact-progress p {
    font-size: 0.9rem;
  }
  
  /* Make the settings button smaller */
  .settings-btn {
    padding: 8px 15px;
    font-size: 0.9rem;
  }
  
  /* Enhance search experience */
  .search-box input {
    padding: 10px 10px 10px 35px;
    font-size: 0.9rem;
  }
  
  /* Make controls take less vertical space */
  .leaderboard-controls {
    margin-bottom: 20px;
  }
  
  .controls-wrapper {
    padding: 12px;
  }
  
  /* Adjust spacing */
  .leaderboard-main {
    padding: 20px 0;
  }
  
  .container {
    width: 95%;
  }
}

/* Even smaller screens */
@media (max-width: 350px) {
  .podium-user {
    max-width: 200px;
  }
  
  .username {
    max-width: 70px;
  }
  
  .impact-stats {
    gap: 10px;
  }
  
  .stat-value {
    font-size: 1.4rem;
  }
}
  </style>