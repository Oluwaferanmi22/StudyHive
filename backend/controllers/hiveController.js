const StudyHive = require('../models/StudyHive');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Get all study hives (with filtering and search)
// @route   GET /api/hives
// @access  Private
const getHives = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      subject = '',
      tags = '',
      privacy = '',
      sortBy = 'lastActivity',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by subject
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Filter by privacy
    if (privacy === 'public') {
      query['settings.isPrivate'] = false;
    } else if (privacy === 'private') {
      query['settings.isPrivate'] = true;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const hives = await StudyHive.find(query)
      .populate('creator', 'username profile.firstName profile.lastName profile.avatar')
      .populate('members.userId', 'username profile.firstName profile.lastName profile.avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await StudyHive.countDocuments(query);

    // Filter out private hives that user is not a member of
    const filteredHives = hives.filter(hive => {
      if (!hive.settings.isPrivate) return true;
      return hive.members.some(member => member.userId._id.toString() === req.user.id);
    });

    res.status(200).json({
      success: true,
      data: filteredHives,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching hives:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single study hive by ID
// @route   GET /api/hives/:id
// @access  Private
const getHive = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id)
      .populate('creator', 'username profile.firstName profile.lastName profile.avatar')
      .populate('members.userId', 'username profile.firstName profile.lastName profile.avatar gamification.level')
      .populate('announcements.author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('studySessions.host', 'username profile.firstName profile.lastName')
      .populate('joinRequests.userId', 'username profile.firstName profile.lastName profile.avatar');

    if (!hive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can access this hive
    if (hive.settings.isPrivate && !hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'This is a private hive. You must be a member to access it.'
      });
    }

    res.status(200).json({
      success: true,
      data: hive
    });
  } catch (error) {
    console.error('Error fetching hive:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new study hive
// @route   POST /api/hives
// @access  Private
const createHive = async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      tags = [],
      settings = {},
      avatar = null,
      banner = null
    } = req.body;

    // Validate required fields
    if (!name || !description || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and subject'
      });
    }

    // Check if hive name already exists
    const existingHive = await StudyHive.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true 
    });

    if (existingHive) {
      return res.status(400).json({
        success: false,
        message: 'A hive with this name already exists'
      });
    }

    // Create hive
    const hive = await StudyHive.create({
      name,
      description,
      subject,
      tags: Array.isArray(tags) ? tags : [],
      creator: req.user.id,
      settings: {
        isPrivate: settings.isPrivate || false,
        requireApproval: settings.requireApproval || false,
        maxMembers: settings.maxMembers || 50,
        allowFileSharing: settings.allowFileSharing !== false,
        allowQuestions: settings.allowQuestions !== false,
        studySchedule: settings.studySchedule || 'Flexible'
      },
      avatar,
      banner
    });

    // Add creator as admin member
    hive.addMember(req.user.id, 'admin');
    await hive.save();

    // Update user's hives array
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        hives: {
          hiveId: hive._id,
          role: 'admin',
          joinedAt: new Date()
        }
      }
    });

    // Award points for creating a hive
    const user = await User.findById(req.user.id);
    user.addPoints(50, 'Created Study Hive');
    await user.save();

    // Populate the response
    await hive.populate('creator', 'username profile.firstName profile.lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Study hive created successfully',
      data: hive
    });
  } catch (error) {
    console.error('Error creating hive:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Join a study hive
// @route   POST /api/hives/:id/join
// @access  Private
const joinHive = async (req, res) => {
  try {
    const { message = '' } = req.body;
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user is already a member
    if (hive.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this hive'
      });
    }

    // Check if hive is full
    if (hive.members.length >= hive.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This hive has reached its maximum member capacity'
      });
    }

    // Check if hive requires approval
    if (hive.settings.requireApproval || hive.settings.isPrivate) {
      // Check if user already has a pending request
      const existingRequest = hive.joinRequests.find(
        req => req.userId.toString() === req.user.id && req.status === 'pending'
      );

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending join request for this hive'
        });
      }

      // Add join request
      hive.joinRequests.push({
        userId: req.user.id,
        message,
        status: 'pending',
        requestedAt: new Date()
      });

      await hive.save();

      return res.status(200).json({
        success: true,
        message: 'Join request submitted successfully. Please wait for approval.',
        data: { status: 'pending' }
      });
    }

    // Direct join for public hives
    hive.addMember(req.user.id, 'member');
    await hive.save();

    // Update user's hives array
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        hives: {
          hiveId: hive._id,
          role: 'member',
          joinedAt: new Date()
        }
      }
    });

    // Award points for joining a hive
    const user = await User.findById(req.user.id);
    user.addPoints(10, 'Joined Study Hive');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined the study hive',
      data: { status: 'joined' }
    });
  } catch (error) {
    console.error('Error joining hive:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Leave a study hive
// @route   POST /api/hives/:id/leave
// @access  Private
const leaveHive = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user is a member
    if (!hive.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this hive'
      });
    }

    // Prevent creator from leaving (they must transfer ownership first)
    if (hive.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'As the creator, you cannot leave this hive. Transfer ownership first or delete the hive.'
      });
    }

    // Remove member
    hive.removeMember(req.user.id);
    await hive.save();

    // Update user's hives array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: {
        hives: { hiveId: hive._id }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the study hive'
    });
  } catch (error) {
    console.error('Error leaving hive:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update study hive
// @route   PUT /api/hives/:id
// @access  Private (Admin/Creator only)
const updateHive = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can administrate
    if (!hive.canAdministrate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this hive'
      });
    }

    const {
      name,
      description,
      subject,
      tags,
      settings,
      avatar,
      banner
    } = req.body;

    // Update fields if provided
    if (name !== undefined) hive.name = name;
    if (description !== undefined) hive.description = description;
    if (subject !== undefined) hive.subject = subject;
    if (tags !== undefined) hive.tags = Array.isArray(tags) ? tags : [];
    if (avatar !== undefined) hive.avatar = avatar;
    if (banner !== undefined) hive.banner = banner;

    // Update settings
    if (settings) {
      if (settings.isPrivate !== undefined) hive.settings.isPrivate = settings.isPrivate;
      if (settings.requireApproval !== undefined) hive.settings.requireApproval = settings.requireApproval;
      if (settings.maxMembers !== undefined) hive.settings.maxMembers = settings.maxMembers;
      if (settings.allowFileSharing !== undefined) hive.settings.allowFileSharing = settings.allowFileSharing;
      if (settings.allowQuestions !== undefined) hive.settings.allowQuestions = settings.allowQuestions;
      if (settings.studySchedule !== undefined) hive.settings.studySchedule = settings.studySchedule;
    }

    hive.lastActivity = new Date();
    await hive.save();

    await hive.populate('creator', 'username profile.firstName profile.lastName profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Study hive updated successfully',
      data: hive
    });
  } catch (error) {
    console.error('Error updating hive:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete study hive
// @route   DELETE /api/hives/:id
// @access  Private (Creator only)
const deleteHive = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Only creator can delete
    if (hive.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete this hive'
      });
    }

    // Soft delete
    hive.isActive = false;
    hive.lastActivity = new Date();
    await hive.save();

    // Remove hive from all members' hives arrays
    await User.updateMany(
      { 'hives.hiveId': hive._id },
      { $pull: { hives: { hiveId: hive._id } } }
    );

    res.status(200).json({
      success: true,
      message: 'Study hive deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hive:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user's hives
// @route   GET /api/hives/my-hives
// @access  Private
const getMyHives = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'hives.hiveId',
      populate: {
        path: 'creator',
        select: 'username profile.firstName profile.lastName profile.avatar'
      }
    });

    // Filter out inactive hives
    const activeHives = user.hives.filter(hive => hive.hiveId && hive.hiveId.isActive);

    res.status(200).json({
      success: true,
      data: activeHives
    });
  } catch (error) {
    console.error('Error fetching user hives:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Manage join requests (approve/reject)
// @route   POST /api/hives/:id/join-requests/:requestId
// @access  Private (Admin/Moderator only)
const manageJoinRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can moderate
    if (!hive.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage join requests'
      });
    }

    const request = hive.joinRequests.id(req.params.requestId);
    if (!request || request.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Join request not found or already processed'
      });
    }

    if (action === 'approve') {
      // Check if hive is full
      if (hive.members.length >= hive.settings.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve request: hive has reached maximum capacity'
        });
      }

      // Add as member
      hive.addMember(request.userId, 'member');
      
      // Update user's hives array
      await User.findByIdAndUpdate(request.userId, {
        $push: {
          hives: {
            hiveId: hive._id,
            role: 'member',
            joinedAt: new Date()
          }
        }
      });

      // Award points to the new member
      const newMember = await User.findById(request.userId);
      newMember.addPoints(10, 'Joined Study Hive');
      await newMember.save();

      request.status = 'approved';
    } else if (action === 'reject') {
      request.status = 'rejected';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await hive.save();

    res.status(200).json({
      success: true,
      message: `Join request ${action}d successfully`,
      data: { request }
    });
  } catch (error) {
    console.error('Error managing join request:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update member role
// @route   PUT /api/hives/:id/members/:memberId
// @access  Private (Admin only)
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can administrate
    if (!hive.canAdministrate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update member roles'
      });
    }

    // Validate role
    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be member, moderator, or admin'
      });
    }

    // Check if member exists
    if (!hive.isMember(req.params.memberId)) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this hive'
      });
    }

    // Update role
    hive.updateMemberRole(req.params.memberId, role);
    await hive.save();

    // Update user's hives array
    await User.findOneAndUpdate(
      { _id: req.params.memberId, 'hives.hiveId': hive._id },
      { $set: { 'hives.$.role': role } }
    );

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Remove member from hive
// @route   DELETE /api/hives/:id/members/:memberId
// @access  Private (Admin/Moderator only)
const removeMember = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can moderate
    if (!hive.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }

    // Check if member exists
    if (!hive.isMember(req.params.memberId)) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this hive'
      });
    }

    // Prevent removing the creator
    if (hive.creator.toString() === req.params.memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the hive creator'
      });
    }

    // Remove member
    hive.removeMember(req.params.memberId);
    await hive.save();

    // Update user's hives array
    await User.findByIdAndUpdate(req.params.memberId, {
      $pull: {
        hives: { hiveId: hive._id }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create announcement
// @route   POST /api/hives/:id/announcements
// @access  Private (Admin/Moderator only)
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, isPinned = false } = req.body;
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can moderate
    if (!hive.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create announcements'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the announcement'
      });
    }

    hive.addAnnouncement(title, content, req.user.id, isPinned);
    await hive.save();

    // Award points for creating announcement
    const user = await User.findById(req.user.id);
    user.addPoints(15, 'Created Announcement');
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: hive.announcements[0]
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get hive members
// @route   GET /api/hives/:id/members
// @access  Private (Member only)
const getHiveMembers = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id)
      .populate('members.userId', 'username profile.firstName profile.lastName profile.avatar gamification.level gamification.points')
      .select('members creator settings.isPrivate');

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can access
    if (hive.settings.isPrivate && !hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view members of this private hive'
      });
    }

    const { search = '', role = '' } = req.query;

    let members = hive.members;

    // Filter by search
    if (search) {
      members = members.filter(member => 
        member.userId.username.toLowerCase().includes(search.toLowerCase()) ||
        member.userId.profile.firstName.toLowerCase().includes(search.toLowerCase()) ||
        member.userId.profile.lastName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by role
    if (role) {
      members = members.filter(member => member.role === role);
    }

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching hive members:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get hive statistics
// @route   GET /api/hives/:id/stats
// @access  Private (Member only)
const getHiveStats = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id)
      .select('statistics members creator settings.isPrivate lastActivity createdAt');

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can access
    if (hive.settings.isPrivate && !hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view statistics of this private hive'
      });
    }

    // Calculate additional stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeMembersThirtyDays = hive.members.filter(member => 
      member.lastActive >= thirtyDaysAgo
    ).length;

    const activeMembersSevenDays = hive.members.filter(member => 
      member.lastActive >= sevenDaysAgo
    ).length;

    const messageCount = await Message.countDocuments({ 
      hive: hive._id, 
      isDeleted: false 
    });

    const recentMessageCount = await Message.countDocuments({ 
      hive: hive._id, 
      isDeleted: false,
      createdAt: { $gte: sevenDaysAgo }
    });

    const stats = {
      ...hive.statistics,
      totalMessages: messageCount,
      totalMembers: hive.members.length,
      activeMembersThirtyDays,
      activeMembersSevenDays,
      recentMessages: recentMessageCount,
      createdAt: hive.createdAt,
      lastActivity: hive.lastActivity
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching hive stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Search hives by various criteria
// @route   GET /api/hives/search
// @access  Private
const searchHives = async (req, res) => {
  try {
    const {
      q = '',
      subject = '',
      tags = '',
      page = 1,
      limit = 10
    } = req.query;

    let query = { 
      isActive: true,
      'settings.isPrivate': false // Only search public hives
    };

    // Search query
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Subject filter
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const hives = await StudyHive.find(query)
      .populate('creator', 'username profile.firstName profile.lastName profile.avatar')
      .select('name description subject tags memberCount statistics.totalMessages statistics.activeMembers lastActivity settings.studySchedule')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await StudyHive.countDocuments(query);

    res.status(200).json({
      success: true,
      data: hives,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error searching hives:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get join requests for a hive
// @route   GET /api/hives/:id/join-requests
// @access  Private (Admin/Moderator only)
const getJoinRequests = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id)
      .populate('joinRequests.userId', 'username profile.firstName profile.lastName profile.avatar')
      .populate('joinRequests.reviewedBy', 'username profile.firstName profile.lastName')
      .select('joinRequests creator members');

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can moderate
    if (!hive.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view join requests'
      });
    }

    const { status = 'pending' } = req.query;
    let requests = hive.joinRequests;

    if (status !== 'all') {
      requests = requests.filter(req => req.status === status);
    }

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate shareable link for hive
// @route   POST /api/hives/:id/share-link
// @access  Private (Creator/Admin only)
const generateShareableLink = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can administrate
    if (!hive.canAdministrate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to generate shareable links for this hive'
      });
    }

    const linkId = hive.generateShareableLink();
    await hive.save();

    res.status(200).json({
      success: true,
      message: 'Shareable link generated successfully',
      data: {
        shareableLink: linkId,
        fullUrl: `${req.protocol}://${req.get('host')}/join/${linkId}`,
        settings: hive.linkSettings
      }
    });
  } catch (error) {
    console.error('Error generating shareable link:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update shareable link settings
// @route   PUT /api/hives/:id/share-link/settings
// @access  Private (Creator/Admin only)
const updateShareableLinkSettings = async (req, res) => {
  try {
    const { requiresApproval, expiresAt, maxUses } = req.body;
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can administrate
    if (!hive.canAdministrate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update shareable link settings for this hive'
      });
    }

    hive.updateLinkSettings({
      requiresApproval,
      expiresAt,
      maxUses
    });
    await hive.save();

    res.status(200).json({
      success: true,
      message: 'Shareable link settings updated successfully',
      data: {
        settings: hive.linkSettings
      }
    });
  } catch (error) {
    console.error('Error updating shareable link settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Disable shareable link
// @route   DELETE /api/hives/:id/share-link
// @access  Private (Creator/Admin only)
const disableShareableLink = async (req, res) => {
  try {
    const hive = await StudyHive.findById(req.params.id);

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can administrate
    if (!hive.canAdministrate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to disable shareable links for this hive'
      });
    }

    hive.disableShareableLink();
    await hive.save();

    res.status(200).json({
      success: true,
      message: 'Shareable link disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling shareable link:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Join hive via shareable link
// @route   POST /api/hives/join/:linkId
// @access  Public
const joinHiveByLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { message = '' } = req.body;

    const hive = await StudyHive.findOne({ shareableLink: linkId });

    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired shareable link'
      });
    }

    // Check if link is valid
    if (!hive.isLinkValid()) {
      return res.status(400).json({
        success: false,
        message: 'This shareable link has expired or reached its usage limit'
      });
    }

    // If user is not authenticated, redirect to login with return URL
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        redirectTo: `/login?returnTo=/join/${linkId}`
      });
    }

    // Check if user is already a member
    if (hive.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this hive'
      });
    }

    // Check if hive is full
    if (hive.members.length >= hive.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This hive has reached its maximum member capacity'
      });
    }

    // Increment link usage
    hive.incrementLinkUsage();

    // Check if approval is required
    if (hive.linkSettings.requiresApproval) {
      // Add join request
      hive.joinRequests.push({
        userId: req.user.id,
        message,
        status: 'pending',
        requestedAt: new Date()
      });

      await hive.save();

      return res.status(200).json({
        success: true,
        message: 'Join request submitted successfully. Please wait for approval.',
        data: { status: 'pending' }
      });
    }

    // Direct join
    hive.addMember(req.user.id, 'member');
    await hive.save();

    // Update user's hives array
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        hives: {
          hiveId: hive._id,
          role: 'member',
          joinedAt: new Date()
        }
      }
    });

    // Award points for joining a hive
    const user = await User.findById(req.user.id);
    user.addPoints(10, 'Joined Study Hive via Shareable Link');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined the study hive',
      data: { 
        status: 'joined',
        hive: {
          id: hive._id,
          name: hive.name,
          description: hive.description
        }
      }
    });
  } catch (error) {
    console.error('Error joining hive by link:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getHives,
  getHive,
  createHive,
  joinHive,
  leaveHive,
  updateHive,
  deleteHive,
  getMyHives,
  manageJoinRequest,
  updateMemberRole,
  removeMember,
  createAnnouncement,
  getHiveMembers,
  getHiveStats,
  searchHives,
  getJoinRequests,
  generateShareableLink,
  updateShareableLinkSettings,
  disableShareableLink,
  joinHiveByLink
};
