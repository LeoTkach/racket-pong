// API Client for Table Tennis Tournament
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const IS_LOCALTUNNEL = API_BASE_URL.includes('loca.lt');

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Extract headers from options to avoid overwriting
    const customHeaders = options.headers || {};
    
    // Build headers - ensure Content-Type is always application/json
    const headers = {
      'Content-Type': 'application/json',
      ...(IS_LOCALTUNNEL ? { 'bypass-tunnel-reminder': '1' } : {}),
      ...customHeaders,
    };
    
    // Build config - don't spread options directly to avoid header conflicts
    const config = {
      method: options.method || 'GET',
      headers,
      body: options.body,
      // Copy any other options that might be needed
      ...(options.credentials ? { credentials: options.credentials } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      // Read response text once - can only be read once
      const text = await response.text();
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (hasJsonContent && text) {
          try {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use text or default error message
            console.error('Failed to parse error response:', e);
            if (text) {
              errorMessage = text;
            }
          }
        } else if (text) {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      // For successful responses, parse JSON if content type is JSON
      if (hasJsonContent) {
        if (!text || text.trim() === '') {
          return {};
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON response:', e, 'Response text:', text);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        // For non-JSON responses, return text
        return text;
      }
    } catch (error) {
      console.error('API Client - Request failed:', error);
      // Provide more helpful error messages
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ERR_INTERNET_DISCONNECTED') || error.name === 'TypeError' || error.message.includes('NetworkError'))) {
        // Don't throw for localhost requests if we're offline - allow app to continue
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          console.warn('Backend server unavailable. App will continue in limited mode.');
          throw new Error('Backend server is not available. Please ensure the backend server is running on port 3003.');
        }
        throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
      }
      // If error is already an Error with message, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise wrap it
      throw new Error(error.message || 'Request failed');
    }
  }

  // Players API
  async getPlayers(params = {}) {
    // Remove undefined values from params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    return this.request(`/players${queryString ? `?${queryString}` : ''}`);
  }

  async getPlayer(id) {
    return this.request(`/players/${id}`);
  }

  async getPlayerByUsername(username) {
    return this.request(`/players/username/${username}`);
  }

  async getPlayerTournaments(playerId) {
    return this.request(`/players/${playerId}/tournaments`);
  }

  async getOrganizerTournaments(organizerId) {
    // Запрашиваем все турниры без пагинации для организатора
    return this.request(`/tournaments?organizer_id=${organizerId}&limit=1000`);
  }

  async startTournament(id) {
    return this.request(`/tournaments/${id}/start`, {
      method: 'POST',
    });
  }

  async createPlayoffMatches(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/create-playoff-matches`, {
      method: 'POST',
    });
  }

  async updatePlayoffMatches(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/update-playoff-matches`, {
      method: 'POST',
    });
  }

  async completeTournament(id) {
    return this.request(`/tournaments/${id}/complete`, {
      method: 'POST',
    });
  }

  async getPlayerMatches(playerId) {
    return this.request(`/players/${playerId}/matches`);
  }

  async getPlayerRatingHistory(playerId) {
    return this.request(`/players/${playerId}/rating-history`);
  }

  async getPlayerAchievements(playerId) {
    return this.request(`/players/${playerId}/achievements`);
  }

  async createPlayer(playerData) {
    return this.request('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async updatePlayer(id, playerData) {
    return this.request(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  }

  async deletePlayer(id) {
    return this.request(`/players/${id}`, {
      method: 'DELETE',
    });
  }

  // Tournaments API
  async getTournaments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tournaments${queryString ? `?${queryString}` : ''}`);
  }

  async getTournament(id) {
    return this.request(`/tournaments/${id}`);
  }

  async getTournamentParticipants(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/participants`);
  }

  async getTournamentMatches(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/matches`);
  }

  async getTournamentStandings(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/standings`);
  }

  async registerForTournament(tournamentId, playerId) {
    return this.request(`/tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId }),
    });
  }

  async registerGuestForTournament(tournamentId, guestData) {
    return this.request(`/tournaments/${tournamentId}/register-guest`, {
      method: 'POST',
      body: JSON.stringify(guestData),
    });
  }

  async getAllTournamentParticipants(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/all-participants`);
  }

  async unregisterFromTournament(tournamentId, playerId) {
    return this.request(`/tournaments/${tournamentId}/register/${playerId}`, {
      method: 'DELETE',
    });
  }

  async uploadTournamentImage(imageFile) {
    // Use local server upload (fallback from Firebase Storage due to billing/CORS issues)
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      const response = await fetch(`${this.baseURL}/upload/tournament-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return {
        message: data.message || 'Image uploaded successfully',
        imageUrl: data.imageUrl,
        filename: data.filename
      };
    } catch (error) {
      console.error('Error uploading tournament image:', error);
      throw error;
    }
  }

  async uploadUserAvatar(avatarFile) {
    // Use local server upload (fallback from Firebase Storage due to billing/CORS issues)
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    try {
      const response = await fetch(`${this.baseURL}/upload/user-avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      const data = await response.json();
      return {
        message: data.message || 'Avatar uploaded successfully',
        imageUrl: data.imageUrl,
        filename: data.filename
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  async createTournament(tournamentData) {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  async updateTournament(id, tournamentData) {
    return this.request(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData),
    });
  }

  async deleteTournament(id) {
    return this.request(`/tournaments/${id}`, {
      method: 'DELETE',
    });
  }

  // Matches API
  async getMatches(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/matches${queryString ? `?${queryString}` : ''}`);
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  async createMatch(matchData) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatch(id, matchData) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatchScores(id, scores) {
    return this.request(`/matches/${id}/scores`, {
      method: 'PUT',
      body: JSON.stringify(scores),
    });
  }

  async startMatch(id) {
    return this.request(`/matches/${id}/start`, {
      method: 'POST',
    });
  }

  async completeMatch(id, winnerId) {
    return this.request(`/matches/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ winner_id: winnerId }),
    });
  }

  async deleteMatch(id) {
    return this.request(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // Achievements API
  async getAchievements(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/achievements${queryString ? `?${queryString}` : ''}`);
  }

  async getAchievement(id) {
    return this.request(`/achievements/${id}`);
  }

  async getPlayerAchievements(playerId) {
    return this.request(`/achievements/player/${playerId}`);
  }

  async unlockAchievement(achievementId, playerId) {
    return this.request(`/achievements/${achievementId}/unlock/${playerId}`, {
      method: 'POST',
    });
  }

  async createAchievement(achievementData) {
    return this.request('/achievements', {
      method: 'POST',
      body: JSON.stringify(achievementData),
    });
  }

  async updateAchievement(id, achievementData) {
    return this.request(`/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(achievementData),
    });
  }

  async deleteAchievement(id) {
    return this.request(`/achievements/${id}`, {
      method: 'DELETE',
    });
  }

  // User Settings API
  async getUserSettings(userId) {
    return this.request(`/players/${userId}/settings`);
  }

  async updateUserSettings(userId, settings) {
    return this.request(`/players/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Auth API
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async firebaseGoogleLogin(firebaseData) {
    return this.request('/auth/firebase-google', {
      method: 'POST',
      body: JSON.stringify(firebaseData),
    });
  }

  async getCurrentUser() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('Not authenticated');
    }
    return this.request('/auth/me', {
      headers: {
        'x-user-id': userId,
      },
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    console.log('[API Client] changePassword called:', {
      userId,
      endpoint: '/auth/change-password',
      method: 'PUT'
    });
    return this.request('/auth/change-password', {
      method: 'PUT',
      headers: {
        'x-user-id': String(userId), // Ensure userId is a string
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Notifications API
  async getNotifications(userId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.unread_only) params.append('unread_only', options.unread_only);
    return this.request(`/notifications/${userId}${params.toString() ? `?${params}` : ''}`);
  }

  async getUnreadCount(userId) {
    return this.request(`/notifications/${userId}/unread-count`);
  }

  async markNotificationRead(notificationId, userId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'x-user-id': String(userId),
      },
    });
  }

  async markAllNotificationsRead(userId) {
    return this.request(`/notifications/${userId}/read-all`, {
      method: 'PUT',
      headers: {
        'x-user-id': String(userId),
      },
    });
  }

  async deleteNotification(notificationId, userId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': String(userId),
      },
    });
  }

  async sendTournamentInvitation(tournamentId, playerId, tournamentName) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        user_id: playerId,
        type: 'tournament',
        title: 'Tournament Invitation',
        message: `You have been invited to participate in the tournament "${tournamentName}"`,
        link_url: `/tournaments/${tournamentId}`,
        metadata: {
          tournament_id: tournamentId,
          action: 'invitation'
        }
      }),
    });
  }

  // PDF Generation API
  async generateTournamentStandingsPDF(data) {
    const url = `${this.baseURL}/pdf/tournament-standings`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Проверяем Content-Type
      const contentType = response.headers.get('content-type');
      console.log('PDF response Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Unexpected Content-Type:', contentType);
      }

      // Return blob for PDF
      const blob = await response.blob();
      
      // Проверяем размер blob
      if (!blob || blob.size === 0) {
        throw new Error('Received empty PDF file from server');
      }
      
      console.log('PDF blob created, size:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async generatePlayerCertificatePDF(data) {
    const url = `${this.baseURL}/pdf/player-certificate`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate certificate PDF' }));
        throw new Error(errorData.error || 'Failed to generate certificate PDF');
      }

      // Проверяем Content-Type
      const contentType = response.headers.get('content-type');
      console.log('Certificate PDF response Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        console.warn('Unexpected Content-Type:', contentType);
      }

      // Return blob for PDF
      const blob = await response.blob();
      
      // Проверяем размер blob
      if (!blob || blob.size === 0) {
        throw new Error('Received empty certificate PDF file from server');
      }
      
      console.log('Certificate PDF blob created, size:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
