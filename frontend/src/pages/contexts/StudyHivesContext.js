import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { hivesAPI, handleAPIError } from '../../services/apiService';
import socketService from '../../services/socketService';
import { useAuth } from './AuthContext';

const StudyHivesContext = createContext();

export const useStudyHives = () => {
  const context = useContext(StudyHivesContext);
  if (!context) {
    throw new Error('useStudyHives must be used within a StudyHivesProvider');
  }
  return context;
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_HIVES: 'SET_HIVES',
  ADD_HIVE: 'ADD_HIVE',
  UPDATE_HIVE: 'UPDATE_HIVE',
  REMOVE_HIVE: 'REMOVE_HIVE',
  SET_CURRENT_HIVE: 'SET_CURRENT_HIVE',
  SET_MY_HIVES: 'SET_MY_HIVES',
  ADD_MEMBER: 'ADD_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  UPDATE_MEMBER: 'UPDATE_MEMBER',
  SET_ONLINE_MEMBERS: 'SET_ONLINE_MEMBERS',
  ADD_ONLINE_MEMBER: 'ADD_ONLINE_MEMBER',
  REMOVE_ONLINE_MEMBER: 'REMOVE_ONLINE_MEMBER'
};

// Initial state
const initialState = {
  hives: [],
  myHives: [],
  currentHive: null,
  onlineMembers: new Set(),
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};

// Reducer
const studyHivesReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.SET_HIVES:
      return {
        ...state,
        hives: action.payload.data,
        pagination: action.payload.pagination,
        isLoading: false
      };

    case ACTIONS.ADD_HIVE:
      return {
        ...state,
        hives: [action.payload, ...state.hives],
        myHives: [...state.myHives, action.payload]
      };

    case ACTIONS.UPDATE_HIVE:
      return {
        ...state,
        hives: state.hives.map(hive =>
          hive._id === action.payload._id ? action.payload : hive
        ),
        currentHive: state.currentHive?._id === action.payload._id 
          ? action.payload 
          : state.currentHive
      };

    case ACTIONS.REMOVE_HIVE:
      return {
        ...state,
        hives: state.hives.filter(hive => hive._id !== action.payload),
        myHives: state.myHives.filter(hive => hive.hiveId._id !== action.payload),
        currentHive: state.currentHive?._id === action.payload ? null : state.currentHive
      };

    case ACTIONS.SET_CURRENT_HIVE:
      return { ...state, currentHive: action.payload, isLoading: false };

    case ACTIONS.SET_MY_HIVES:
      return { ...state, myHives: action.payload, isLoading: false };

    case ACTIONS.ADD_MEMBER:
      if (state.currentHive) {
        return {
          ...state,
          currentHive: {
            ...state.currentHive,
            members: [...state.currentHive.members, action.payload]
          }
        };
      }
      return state;

    case ACTIONS.REMOVE_MEMBER:
      if (state.currentHive) {
        return {
          ...state,
          currentHive: {
            ...state.currentHive,
            members: state.currentHive.members.filter(
              member => member.userId._id !== action.payload
            )
          }
        };
      }
      return state;

    case ACTIONS.UPDATE_MEMBER:
      if (state.currentHive) {
        return {
          ...state,
          currentHive: {
            ...state.currentHive,
            members: state.currentHive.members.map(member =>
              member.userId._id === action.payload.userId
                ? { ...member, role: action.payload.role }
                : member
            )
          }
        };
      }
      return state;

    case ACTIONS.SET_ONLINE_MEMBERS:
      return { ...state, onlineMembers: new Set(action.payload) };

    case ACTIONS.ADD_ONLINE_MEMBER:
      return {
        ...state,
        onlineMembers: new Set([...state.onlineMembers, action.payload])
      };

    case ACTIONS.REMOVE_ONLINE_MEMBER:
      const newOnlineMembers = new Set(state.onlineMembers);
      newOnlineMembers.delete(action.payload);
      return { ...state, onlineMembers: newOnlineMembers };

    default:
      return state;
  }
};

export const StudyHivesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(studyHivesReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Socket event handlers
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserJoinedHive = (data) => {
      dispatch({ type: ACTIONS.ADD_ONLINE_MEMBER, payload: data.userId });
    };

    const handleUserLeftHive = (data) => {
      dispatch({ type: ACTIONS.REMOVE_ONLINE_MEMBER, payload: data.userId });
    };

    const handleHiveJoined = (data) => {
      dispatch({ type: ACTIONS.SET_ONLINE_MEMBERS, payload: data.onlineUsers });
    };

    const handleConnectionStatus = (data) => {
      if (!data.connected) {
        dispatch({ type: ACTIONS.SET_ONLINE_MEMBERS, payload: [] });
      }
    };

    // Register socket event listeners
    socketService.on('user_joined_hive', handleUserJoinedHive);
    socketService.on('user_left_hive', handleUserLeftHive);
    socketService.on('hive_joined', handleHiveJoined);
    socketService.on('connection_status', handleConnectionStatus);

    return () => {
      socketService.off('user_joined_hive', handleUserJoinedHive);
      socketService.off('user_left_hive', handleUserLeftHive);
      socketService.off('hive_joined', handleHiveJoined);
      socketService.off('connection_status', handleConnectionStatus);
    };
  }, [isAuthenticated]);

  // Get all hives
  const getHives = async (params = {}) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.getHives(params);
      
      if (response.success) {
        dispatch({
          type: ACTIONS.SET_HIVES,
          payload: {
            data: response.data,
            pagination: response.pagination
          }
        });
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Get single hive
  const getHive = async (hiveId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.getHive(hiveId);
      
      if (response.success) {
        dispatch({ type: ACTIONS.SET_CURRENT_HIVE, payload: response.data });
        
        // Join hive room via socket
        if (socketService.isConnected()) {
          socketService.joinHive(hiveId);
        }
        
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Create hive
  const createHive = async (hiveData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.createHive(hiveData);
      
      if (response.success) {
        dispatch({ type: ACTIONS.ADD_HIVE, payload: response.data });
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Update hive
  const updateHive = async (hiveId, hiveData) => {
    try {
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.updateHive(hiveId, hiveData);
      
      if (response.success) {
        dispatch({ type: ACTIONS.UPDATE_HIVE, payload: response.data });
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Delete hive
  const deleteHive = async (hiveId) => {
    try {
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.deleteHive(hiveId);
      
      if (response.success) {
        dispatch({ type: ACTIONS.REMOVE_HIVE, payload: hiveId });
        
        // Leave hive room via socket
        if (socketService.isConnected()) {
          socketService.leaveHive(hiveId);
        }
        
        return { success: true };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Join hive
  const joinHive = async (hiveId, message = '') => {
    try {
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.joinHive(hiveId, message);
      
      if (response.success) {
        // Refresh current hive if it's the one being joined
        if (state.currentHive?._id === hiveId) {
          await getHive(hiveId);
        }
        
        // Refresh my hives
        await getMyHives();
        
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Leave hive
  const leaveHive = async (hiveId) => {
    try {
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.leaveHive(hiveId);
      
      if (response.success) {
        // Leave hive room via socket
        if (socketService.isConnected()) {
          socketService.leaveHive(hiveId);
        }
        
        // Refresh my hives
        await getMyHives();
        
        return { success: true };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Get my hives
  const getMyHives = async () => {
    try {
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.getMyHives();
      
      if (response.success) {
        dispatch({ type: ACTIONS.SET_MY_HIVES, payload: response.data });
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Search hives
  const searchHives = async (params = {}) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.CLEAR_ERROR });

      const response = await hivesAPI.searchHives(params);
      
      if (response.success) {
        dispatch({
          type: ACTIONS.SET_HIVES,
          payload: {
            data: response.data,
            pagination: response.pagination
          }
        });
        return { success: true, data: response.data };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Member management
  const updateMemberRole = async (hiveId, memberId, role) => {
    try {
      const response = await hivesAPI.updateMemberRole(hiveId, memberId, role);
      
      if (response.success) {
        dispatch({
          type: ACTIONS.UPDATE_MEMBER,
          payload: { userId: memberId, role }
        });
        return { success: true };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  const removeMember = async (hiveId, memberId) => {
    try {
      const response = await hivesAPI.removeMember(hiveId, memberId);
      
      if (response.success) {
        dispatch({ type: ACTIONS.REMOVE_MEMBER, payload: memberId });
        return { success: true };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorResult = handleAPIError(error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: errorResult.message });
      return errorResult;
    }
  };

  // Clear current hive (when leaving hive page)
  const clearCurrentHive = () => {
    if (state.currentHive && socketService.isConnected()) {
      socketService.leaveHive(state.currentHive._id);
    }
    dispatch({ type: ACTIONS.SET_CURRENT_HIVE, payload: null });
    dispatch({ type: ACTIONS.SET_ONLINE_MEMBERS, payload: [] });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  const value = {
    // State
    ...state,
    
    // Actions
    getHives,
    getHive,
    createHive,
    updateHive,
    deleteHive,
    joinHive,
    leaveHive,
    getMyHives,
    searchHives,
    updateMemberRole,
    removeMember,
    clearCurrentHive,
    clearError,
    
    // Helper functions
    isHiveMember: (hiveId) => {
      return state.myHives.some(hive => hive.hiveId._id === hiveId);
    },
    
    getUserRole: (hiveId) => {
      const userHive = state.myHives.find(hive => hive.hiveId._id === hiveId);
      return userHive?.role || null;
    },
    
    canModerate: (hiveId) => {
      const role = value.getUserRole(hiveId);
      return role === 'admin' || role === 'moderator';
    },
    
    canAdministrate: (hiveId) => {
      const role = value.getUserRole(hiveId);
      const isCreator = state.currentHive?.creator._id === user?.id;
      return role === 'admin' || isCreator;
    }
  };

  return (
    <StudyHivesContext.Provider value={value}>
      {children}
    </StudyHivesContext.Provider>
  );
};
