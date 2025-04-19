import { pool } from '../db';

/**
 * Service for handling notifications
 */
export class NotificationService {
  /**
   * Create a new admin notification
   */
  static async createNotification(
    type: string, 
    title: string, 
    message: string, 
    referenceId?: number,
    referenceType?: string
  ) {
    try {
      const result = await pool.query(
        `INSERT INTO admin_notifications 
        (type, title, message, reference_id, reference_type, created_at) 
        VALUES ($1, $2, $3, $4, $5, NOW()) 
        RETURNING id`,
        [type, title, message, referenceId, referenceType]
      );
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create a user notification
   */
  static async createUserNotification(
    userId: number,
    type: string, 
    title: string, 
    message: string, 
    referenceId?: number,
    referenceType?: string
  ) {
    try {
      const result = await pool.query(
        `INSERT INTO user_notifications 
        (user_id, type, title, message, reference_id, reference_type, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
        RETURNING id`,
        [userId, type, title, message, referenceId, referenceType]
      );
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  /**
   * Get all admin notifications with optional filtering
   */
  static async getNotifications(options: {
    isRead?: boolean,
    limit?: number,
    offset?: number,
    type?: string
  } = {}) {
    try {
      let query = `SELECT * FROM admin_notifications`;
      const queryParams: any[] = [];
      const conditions: string[] = [];
      
      // Build WHERE clause based on options
      if (options.isRead !== undefined) {
        conditions.push(`is_read = $${queryParams.length + 1}`);
        queryParams.push(options.isRead);
      }
      
      if (options.type) {
        conditions.push(`type = $${queryParams.length + 1}`);
        queryParams.push(options.type);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Add ordering
      query += ' ORDER BY created_at DESC';
      
      // Add pagination
      if (options.limit) {
        query += ` LIMIT $${queryParams.length + 1}`;
        queryParams.push(options.limit);
        
        if (options.offset) {
          query += ` OFFSET $${queryParams.length + 1}`;
          queryParams.push(options.offset);
        }
      }
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: number, options: {
    isRead?: boolean,
    limit?: number,
    offset?: number,
    type?: string
  } = {}) {
    try {
      let query = `SELECT * FROM user_notifications WHERE user_id = $1`;
      const queryParams: any[] = [userId];
      
      // Build additional clauses based on options
      if (options.isRead !== undefined) {
        query += ` AND is_read = $${queryParams.length + 1}`;
        queryParams.push(options.isRead);
      }
      
      if (options.type) {
        query += ` AND type = $${queryParams.length + 1}`;
        queryParams.push(options.type);
      }
      
      // Add ordering
      query += ' ORDER BY created_at DESC';
      
      // Add pagination
      if (options.limit) {
        query += ` LIMIT $${queryParams.length + 1}`;
        queryParams.push(options.limit);
        
        if (options.offset !== undefined) {
          query += ` OFFSET $${queryParams.length + 1}`;
          queryParams.push(options.offset);
        }
      }
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification count by read status
   */
  static async getNotificationCount(isRead: boolean = false) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM admin_notifications WHERE is_read = $1',
        [isRead]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notification count
   */
  static async getUserNotificationCount(userId: number, isRead: boolean = false) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM user_notifications WHERE user_id = $1 AND is_read = $2',
        [userId, isRead]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark admin notification as read
   */
  static async markAsRead(notificationId: number) {
    try {
      await pool.query(
        'UPDATE admin_notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1',
        [notificationId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark user notification as read
   */
  static async markUserNotificationAsRead(userId: number, notificationId: number) {
    try {
      await pool.query(
        'UPDATE user_notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
    } catch (error) {
      console.error('Error marking user notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all admin notifications as read
   */
  static async markAllAsRead() {
    try {
      await pool.query(
        'UPDATE admin_notifications SET is_read = TRUE, read_at = NOW() WHERE is_read = FALSE'
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllUserNotificationsAsRead(userId: number) {
    try {
      await pool.query(
        'UPDATE user_notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
        [userId]
      );
    } catch (error) {
      console.error('Error marking all user notifications as read:', error);
      throw error;
    }
  }
  

  /**
   * Create new user notification specifically
   */
  static async createNewUserNotification(userId: number, username: string) {
    return this.createNotification(
      'new_user',
      'New User Registration',
      `User "${username}" has registered`,
      userId,
      'user'
    );
  }

  /**
   * Create notification for a new contact message
   */
  static async createContactMessageNotification(messageId: number, name: string, email: string) {
    return this.createNotification(
      'message',
      'New Contact Message',
      `New message from ${name} (${email})`,
      messageId,
      'contact_message'
    );
  }

  /**
   * Create a notification for when a user earns a badge
   */
  static async createBadgeEarnedNotification(userId: number, badgeId: number, badgeName: string) {
    return this.createUserNotification(
      userId,
      'badge_earned',
      'New Badge Earned!',
      `Congratulations! You've earned the ${badgeName} badge.`,
      badgeId,
      'badge'
    );
  }

  /**
   * Create a notification for when a user completes a challenge
   */
  static async createChallengeCompletedNotification(userId: number, challengeId: number, challengeName: string, points: number) {
    return this.createUserNotification(
      userId,
      'challenge_completed',
      'Challenge Completed!',
      `You've successfully completed the "${challengeName}" challenge and earned ${points} points!`,
      challengeId,
      'challenge'
    );
  }

  /**
   * Create a notification for leaderboard ranking updates
   */
  static async createLeaderboardUpdateNotification(userId: number, newRank: number, oldRank?: number) {
    let message = `Your current rank on the leaderboard is #${newRank}.`;
    
    if (oldRank && oldRank > newRank) {
      message = `Your leaderboard position improved from #${oldRank} to #${newRank}!`;
    }
    
    return this.createUserNotification(
      userId,
      'leaderboard_update',
      'Leaderboard Update',
      message,
      undefined,
      'leaderboard'
    );
  }

  /**
   * Create a notification for reaching top leaderboard positions
   */
  static async createLeaderboardTopPositionNotification(userId: number, rank: number) {
    let title: string;
    let message: string;
    
    switch (rank) {
      case 1:
        title = '🏆 Congratulations! You\'re #1';
        message = 'Amazing achievement! You\'ve reached the #1 position on the leaderboard!';
        break;
      case 2:
        title = '🥈 Congratulations! You\'re #2';
        message = 'Impressive! You\'ve reached the #2 position on the leaderboard!';
        break;
      case 3:
        title = '🥉 Congratulations! You\'re #3';
        message = 'Well done! You\'ve reached the #3 position on the leaderboard!';
        break;
      default:
        return null; // Don't create notification for positions outside top 3
    }
    
    return this.createUserNotification(
      userId,
      'leaderboard_position',
      title,
      message,
      rank, // Store the rank as reference_id
      'leaderboard_rank'
    );
  }

  /**
   * Create a system announcement notification for all users
   */
  static async createSystemAnnouncementForAllUsers(title: string, message: string) {
    try {
      // Get all active users
      const userResult = await pool.query(
        'SELECT id FROM users WHERE is_active = TRUE'
      );
      
      // Create a notification for each user
      const promises = userResult.rows.map(user => 
        this.createUserNotification(
          user.id,
          'system_announcement',
          title,
          message
        )
      );
      
      await Promise.all(promises);
      
      return userResult.rows.length; // Return number of notifications created
    } catch (error) {
      console.error('Error creating system announcement notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;