import express from 'express';
import { db, pool } from '../src/db/index.ts';
import { users, messages } from '../src/db/schema.ts';
import { eq, or, and, inArray } from 'drizzle-orm';
import { deleteFileFromDrive } from './gdrive.ts';
import {
  hashPassword,
  hashPin,
  isUserOnline,
  isUserFocused,
  onlineUsers,
  focusedUsers,
  cameraPermissionUsers
} from './helpers.ts';

const router = express.Router();

// Auth / Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
    }

    const inputHashed = hashPassword(password);
    const cleanUsername = username.trim().toLowerCase();
    const results = await db.select().from(users).where(eq(users.username, cleanUsername));
    const user = results[0];

    if (!user || user.password !== inputHashed) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      publicKeySpki: user.publicKeySpki,
      telegramChatId: user.telegramChatId,
      patternLock: user.patternLock,
      hasPinCode: !!user.pinCode,
      allowDelayLock: user.allowDelayLock,
      theme: user.theme || 'dantri'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra trong quá trình đăng nhập.' });
  }
});

// Verify PIN or Password securely on the server
router.post('/auth/verify-credential', async (req, res) => {
  try {
    const { userId, type, value } = req.body;
    if (!userId || !type || value === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin xác thực.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    if (type === 'password') {
      const inputHashed = hashPassword(value);
      if (user.password === inputHashed) {
        return res.json({ success: true });
      }
    } else if (type === 'pin') {
      const inputHashed = hashPin(value);
      if (user.pinCode === inputHashed || user.pinCode === value) {
        return res.json({ success: true });
      }
    }

    return res.json({ success: false });
  } catch (error: any) {
    console.error('Verify credential error:', error);
    res.status(500).json({ error: 'Có lỗi hệ thống xảy ra.' });
  }
});

// Get active users
router.get('/users/status', async (req, res) => {
  try {
    const { userId, isFocused, hasCameraPermission } = req.query;
    
    if (userId && typeof userId === 'string') {
      onlineUsers.set(userId, Date.now());
      if (isFocused === 'true') {
        focusedUsers.set(userId, Date.now());
      } else {
        focusedUsers.delete(userId);
      }
      if (hasCameraPermission !== undefined) {
        cameraPermissionUsers.set(userId, hasCameraPermission === 'true');
      }
    }

    // Determine target user IDs to return (friends list + self)
    let friendIds: string[] = [];
    if (userId && typeof userId === 'string') {
      const results = await db.select().from(users).where(eq(users.id, userId));
      const currentUser = results[0];
      if (currentUser) {
        friendIds = (currentUser.friends as string[]) || [];
        friendIds.push(userId);
      }
    }

    const targetIds = friendIds.length > 0 ? friendIds : Array.from(onlineUsers.keys());

    const statusList = targetIds.map(uId => ({
      id: uId,
      isOnline: isUserOnline(uId),
      isFocused: isUserFocused(uId),
      lastSeen: onlineUsers.get(uId) || null,
      hasCameraPermission: cameraPermissionUsers.get(uId) || false
    }));

    res.json(statusList);
  } catch (error: any) {
    console.error('Get users status error:', error);
    res.status(500).json({ error: 'Không thể lấy trạng thái người dùng.' });
  }
});

// Get active users
router.get('/users', async (req, res) => {
  try {
    const { userId, includeSelf, isFocused, hasCameraPermission } = req.query;
    
    if (userId && typeof userId === 'string') {
      onlineUsers.set(userId, Date.now());
      if (isFocused === 'true') {
        focusedUsers.set(userId, Date.now());
      } else {
        focusedUsers.delete(userId);
      }
      if (hasCameraPermission !== undefined) {
        cameraPermissionUsers.set(userId, hasCameraPermission === 'true');
      }
    }

    let usersList;

    if (userId && typeof userId === 'string') {
      const results = await db.select().from(users).where(eq(users.id, userId));
      const currentUser = results[0];
      if (currentUser) {
        const friendsList = (currentUser.friends as string[]) || [];
        const idsToFetch = [...friendsList];
        if (includeSelf === 'true') {
          idsToFetch.push(userId);
        }
        if (idsToFetch.length > 0) {
          usersList = await db.select().from(users).where(inArray(users.id, idsToFetch));
        } else {
          usersList = [];
        }
      } else {
        usersList = [];
      }
    } else {
      usersList = await db.select().from(users);
    }

    const safeUsers = usersList.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      publicKeySpki: u.publicKeySpki,
      telegramChatId: u.telegramChatId || null,
      friends: u.friends || [],
      patternLock: u.patternLock,
      hasPinCode: !!u.pinCode,
      allowDelayLock: u.allowDelayLock,
      isOnline: isUserOnline(u.id),
      isFocused: isUserFocused(u.id),
      lastSeen: onlineUsers.get(u.id) || null,
      hasCameraPermission: cameraPermissionUsers.get(u.id) || false,
      theme: u.theme || 'dantri'
    }));
    res.json(safeUsers);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách người dùng.' });
  }
});

// Profile self-update
router.post('/users/profile', async (req, res) => {
  try {
    const { userId, name, password, pinCode, telegramChatId, patternLock } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Thiếu thông tin người dùng.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (telegramChatId !== undefined) {
      updateData.telegramChatId = telegramChatId ? telegramChatId.toString().trim() : null;
    }
    if (password) {
      updateData.password = hashPassword(password);
    }
    if (pinCode) {
      updateData.pinCode = hashPin(pinCode);
    }
    if (patternLock !== undefined) {
      updateData.patternLock = patternLock;
    }

    const updatedResults = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    const updatedUser = updatedResults[0];

    res.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        publicKeySpki: updatedUser.publicKeySpki,
        telegramChatId: updatedUser.telegramChatId,
        patternLock: updatedUser.patternLock,
        hasPinCode: !!updatedUser.pinCode,
        allowDelayLock: updatedUser.allowDelayLock,
        theme: updatedUser.theme || 'dantri'
      }
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Không thể cập nhật hồ sơ cá nhân.' });
  }
});

// Add Friend
router.post('/users/add-friend', async (req, res) => {
  try {
    const { userId, friendUsername, friendPassword } = req.body;
    
    if (!userId || !friendUsername || !friendPassword) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu của bạn muốn kết bạn.' });
    }

    const userResults = await db.select().from(users).where(eq(users.id, userId));
    const currentUser = userResults[0];
    if (!currentUser) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản của bạn.' });
    }

    const cleanFriendUsername = friendUsername.trim().toLowerCase();
    const friendHashed = hashPassword(friendPassword);
    const friendResults = await db.select().from(users).where(eq(users.username, cleanFriendUsername));
    const friend = friendResults[0];

    if (!friend || friend.password !== friendHashed) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu của người bạn này không chính xác.' });
    }

    if (userId === friend.id) {
      return res.status(400).json({ error: 'Bạn không thể kết bạn với chính mình.' });
    }

    const currentUserFriends = (currentUser.friends as string[]) || [];
    const friendFriends = (friend.friends as string[]) || [];

    if (currentUserFriends.includes(friend.id)) {
      return res.status(400).json({ error: 'Hai người đã là bạn của nhau rồi.' });
    }

    const updatedUserFriends = [...currentUserFriends, friend.id];
    const updatedFriendFriends = friendFriends.includes(currentUser.id) 
      ? friendFriends 
      : [...friendFriends, currentUser.id];

    await db.update(users)
      .set({ friends: updatedUserFriends })
      .where(eq(users.id, currentUser.id));

    await db.update(users)
      .set({ friends: updatedFriendFriends })
      .where(eq(users.id, friend.id));

    res.json({ success: true, message: `Kết bạn thành công với ${friend.name}!` });
  } catch (error: any) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi kết bạn.' });
  }
});

// Unlink/Unfriend (Admin only)
router.post('/users/unlink-friend', async (req, res) => {
  try {
    const { adminId, userAId, userBId } = req.body;
    
    if (!adminId || !userAId || !userBId) {
      return res.status(400).json({ error: 'Thiếu thông tin người dùng.' });
    }

    const adminResults = await db.select().from(users).where(eq(users.id, adminId));
    const adminUser = adminResults[0];
    if (!adminUser || (adminUser.username !== 'phong' && adminUser.role !== 'admin')) {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện chức năng này.' });
    }

    const userAResults = await db.select().from(users).where(eq(users.id, userAId));
    const userBResults = await db.select().from(users).where(eq(users.id, userBId));
    const userA = userAResults[0];
    const userB = userBResults[0];

    if (!userA || !userB) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng cần hủy liên kết.' });
    }

    const friendsA = (userA.friends as string[]) || [];
    const friendsB = (userB.friends as string[]) || [];

    const updatedFriendsA = friendsA.filter((id) => id !== userBId);
    const updatedFriendsB = friendsB.filter((id) => id !== userAId);

    await db.update(users)
      .set({ friends: updatedFriendsA })
      .where(eq(users.id, userAId));

    await db.update(users)
      .set({ friends: updatedFriendsB })
      .where(eq(users.id, userBId));

    res.json({ success: true, message: `Đã hủy liên kết thành công giữa ${userA.name} và ${userB.name}!` });
  } catch (error: any) {
    console.error('Unlink friend error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi hủy liên kết.' });
  }
});

// Admin creating a new user
router.post('/users', async (req, res) => {
  try {
    const { username, password, name, role, pinCode, avatar, telegramChatId, patternLock, allowDelayLock, theme } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (username, password, name).' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await db.select().from(users).where(eq(users.username, cleanUsername));
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại trên hệ thống.' });
    }

    const newUser = {
      id: cleanUsername,
      username: cleanUsername,
      password: hashPassword(password),
      name,
      role: role || 'user',
      avatar: avatar || `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1570295999919-56ceb5ecca61', '1438761681033-6461ffad8d80'][Math.floor(Math.random() * 4)]}?w=100&auto=format&fit=crop&q=80`,
      publicKeySpki: null,
      pinCode: hashPin(pinCode || '1234'),
      friends: [],
      telegramChatId: telegramChatId ? telegramChatId.toString().trim() : null,
      patternLock: patternLock || null,
      allowDelayLock: allowDelayLock !== undefined ? !!allowDelayLock : false,
      theme: theme || 'dantri'
    };

    await db.insert(users).values(newUser);

    const safeNewUser = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar,
      publicKeySpki: newUser.publicKeySpki,
      telegramChatId: newUser.telegramChatId,
      patternLock: newUser.patternLock,
      hasPinCode: !!newUser.pinCode,
      allowDelayLock: newUser.allowDelayLock,
      theme: newUser.theme
    };

    res.status(201).json({ success: true, user: safeNewUser });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Không thể tạo người dùng mới.' });
  }
});

// Admin or user updating user details
router.post('/users/update', async (req, res) => {
  try {
    const { id, name, role, pinCode, password, avatar, telegramChatId, requesterId, patternLock, allowDelayLock, theme } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Thiếu ID người dùng.' });
    }

    const effectiveRequesterId = requesterId || id;
    const requesterResults = await db.select().from(users).where(eq(users.id, effectiveRequesterId));
    const requester = requesterResults[0];

    if (!requester) {
      return res.status(403).json({ error: 'Không xác định được người yêu cầu cập nhật.' });
    }

    if (requester.role !== 'admin' && id !== requester.id) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật thông tin của người dùng khác.' });
    }

    const results = await db.select().from(users).where(eq(users.id, id));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (pinCode) updateData.pinCode = hashPin(pinCode);
    if (avatar) updateData.avatar = avatar;
    if (telegramChatId !== undefined) {
      updateData.telegramChatId = telegramChatId ? telegramChatId.toString().trim() : null;
    }
    if (password) {
      updateData.password = hashPassword(password);
    }
    if (patternLock !== undefined) {
      updateData.patternLock = patternLock;
    }
    if (allowDelayLock !== undefined) {
      updateData.allowDelayLock = !!allowDelayLock;
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }

    if (role) {
      if (requester.role === 'admin') {
        updateData.role = role;
      } else if (role !== user.role) {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thay đổi vai trò tài khoản.' });
      }
    }

    const updatedResults = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    const updatedUser = updatedResults[0];

    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        publicKeySpki: updatedUser.publicKeySpki,
        telegramChatId: updatedUser.telegramChatId,
        patternLock: updatedUser.patternLock,
        hasPinCode: !!updatedUser.pinCode,
        allowDelayLock: updatedUser.allowDelayLock,
        theme: updatedUser.theme || 'dantri'
      }
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Không thể cập nhật người dùng.' });
  }
});

// Admin deleting a user
router.post('/users/delete', async (req, res) => {
  try {
    const { adminId, targetUserId } = req.body;
    if (!adminId || !targetUserId) {
      return res.status(400).json({ error: 'Thiếu thông tin quản trị viên hoặc tài khoản cần xóa.' });
    }

    const adminResults = await db.select().from(users).where(eq(users.id, adminId));
    const adminUser = adminResults[0];
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện chức năng này.' });
    }

    if (adminId === targetUserId) {
      return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản quản trị của chính mình.' });
    }

    const targetResults = await db.select().from(users).where(eq(users.id, targetUserId));
    const targetUser = targetResults[0];
    if (!targetUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng cần xóa.' });
    }

    // Query only users who actually have the targetUserId in their friends list
    const usersToUpdate = await pool.query({
      text: `SELECT id, friends FROM users WHERE friends @> $1::jsonb`,
      values: [JSON.stringify([targetUserId])]
    });

    for (const otherUser of usersToUpdate.rows) {
      const friendsList = (otherUser.friends as string[]) || [];
      const updatedFriends = friendsList.filter(id => id !== targetUserId);
      await db.update(users)
        .set({ friends: updatedFriends })
        .where(eq(users.id, otherUser.id));
    }

    // Find and delete Google Drive files in background (non-blocking)
    const msgsToDelete = await db.select({ gdriveFileId: messages.gdriveFileId })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, targetUserId),
          eq(messages.recipientId, targetUserId)
        )
      );
    
    for (const m of msgsToDelete) {
      if (m.gdriveFileId) {
        deleteFileFromDrive(m.gdriveFileId).catch(gerr => {
          console.error('Error deleting file during admin delete user:', gerr);
        });
      }
    }

    await db.delete(messages)
      .where(
        or(
          eq(messages.senderId, targetUserId),
          eq(messages.recipientId, targetUserId)
        )
      );

    await db.delete(users).where(eq(users.id, targetUserId));

    res.json({ success: true, message: `Đã xóa tài khoản "${targetUser.name}" thành công.` });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Không thể xóa tài khoản.' });
  }
});

// Upload user's public key (E2EE)
router.post('/users/publicKey', async (req, res) => {
  try {
    const { userId, publicKeySpki } = req.body;
    if (!userId || !publicKeySpki) {
      return res.status(400).json({ error: 'Thiếu userId hoặc publicKeySpki.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    await db.update(users)
      .set({ publicKeySpki: publicKeySpki })
      .where(eq(users.id, userId));

    res.json({ success: true, message: 'Đăng ký khóa công khai thành công!' });
  } catch (error: any) {
    console.error('Upload public key error:', error);
    res.status(500).json({ error: 'Không thể đăng ký khóa công khai.' });
  }
});

// Reset user's cryptographic keys
router.post('/users/reset', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId.' });
    }

    const results = await db.select().from(users).where(eq(users.id, userId));
    const user = results[0];
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    await db.update(users)
      .set({ publicKeySpki: null })
      .where(eq(users.id, userId));

    // Find and delete Google Drive files in background (non-blocking)
    const msgsToDelete = await db.select({ gdriveFileId: messages.gdriveFileId })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)));
    
    for (const m of msgsToDelete) {
      if (m.gdriveFileId) {
        deleteFileFromDrive(m.gdriveFileId).catch(gerr => {
          console.error('Error deleting file during key reset:', gerr);
        });
      }
    }

    await db.delete(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)));

    res.json({ success: true, message: 'Đã reset khóa và xóa sạch cuộc trò chuyện của người dùng.' });
  } catch (error: any) {
    console.error('Reset keys error:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi đặt lại khóa.' });
  }
});

export default router;
