import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Send,
  Clock,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  Terminal,
  Wifi,
  Battery,
  Signal,
  Smartphone,
  Eye,
  Settings,
  HelpCircle,
  QrCode,
  ShieldCheck,
  Fingerprint,
  Cpu,
  Plus,
  Users,
  UserPlus,
  Edit2,
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  LogOut,
  Activity,
  User,
  X,
  MessageSquare,
  Shield,
  Newspaper,
  BookOpen,
  Bell,
  Download,
  FileText,
  Key
} from 'lucide-react';
import { Message, UserSession } from './types';
import useAppLogic from './hooks/useAppLogic';
import PatternSetupComponent from './components/PatternSetupComponent';
import {
  generateE2EKeyPair,
  exportPublicKey,
  encryptMessage,
  decryptMessage,
  exportPrivateKey,
  importPrivateKey,
  EncryptedPayload
} from './utils/crypto';
import ScreenLockOverlay from './components/ScreenLockOverlay';
import CryptoInspector from './components/CryptoInspector';
import CameraModal from './components/CameraModal';
import ScreenShield from './components/ScreenShield';
import ImageLightbox from './components/ImageLightbox';
import UserChatSidebar from './components/UserChatSidebar';

// Splitted clean components
import EditorialLoginScreen from './components/EditorialLoginScreen';
import NewspaperHeader from './components/NewspaperHeader';
import SecurityHubSidebar from './components/SecurityHubSidebar';
import AdminPanel from './components/AdminPanel';
import ChatArea from './components/ChatArea';
import EditorialSection from './components/EditorialSection';
import RightSidebar from './components/RightSidebar';
import NotificationConfigModal from './components/NotificationConfigModal';
import AdminDeletePostingsModal from './components/AdminDeletePostingsModal';
import AdminSqlQueryModal from './components/AdminSqlQueryModal';
import PWAInstallPromptModal from './components/PWAInstallPromptModal';
import FileAttachmentCard from './components/FileAttachmentCard';
import { linkify } from './utils/linkify';
import { resizeAndCompressImage } from './utils/image';
import { MessageContentRenderer } from './components/MessageContentRenderer';

import { EDITORIAL_ARTICLES } from './data/articles';

export default function App() {
  const {
    appMode,
    cameraTriggerSource,
    setCameraTriggerSource,
    isCameraAuthorizedReal,
    setIsCameraAuthorizedReal,
    realDefaultAuthMode,
    setRealDefaultAuthMode,
    realForcePasswordOnly,
    setRealForcePasswordOnly,
    realUser,
    setRealUser,
    realUserPrivateKey,
    setRealUserPrivateKey,
    prefWebPush,
    setPrefWebPush,
    prefTelegram,
    setPrefTelegram,
    isPushSubscribed,
    setIsPushSubscribed,
    vapidPublicKey,
    setVapidPublicKey,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    userTelegramChatIdInput,
    setUserTelegramChatIdInput,
    notificationConfigSuccess,
    setNotificationConfigSuccess,
    notificationConfigError,
    setNotificationConfigError,
    isSavingNotificationConfig,
    setIsSavingNotificationConfig,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    isLoggingIn,
    setIsLoggingIn,
    activeRecipient,
    setActiveRecipient,
    usersList,
    setUsersList,
    realMessages,
    setRealMessages,
    hasMoreMessages,
    isLoadingOlder,
    loadOlderMessages,
    realInputRef,
    isFirstPollRef,
    realInput,
    setRealInput,
    realSelfDestruct,
    setRealSelfDestruct,
    isRealDestructOpen,
    setIsRealDestructOpen,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    newUsername,
    setNewUsername,
    newPassword,
    setNewPassword,
    newName,
    setNewName,
    newRole,
    setNewRole,
    newPinCode,
    setNewPinCode,
    adminSuccessMsg,
    setAdminSuccessMsg,
    adminErrorMsg,
    setAdminErrorMsg,
    telegramBotToken,
    setTelegramBotToken,
    webNotification,
    setWebNotification,
    newTelegramChatId,
    setNewTelegramChatId,
    testTelegramChatId,
    setTestTelegramChatId,
    testLoading,
    setTestLoading,
    testSuccessMsg,
    setTestSuccessMsg,
    testErrorMsg,
    setTestErrorMsg,
    allUsersList,
    setAllUsersList,
    editingUser,
    setEditingUser,
    editName,
    setEditName,
    editRole,
    setEditRole,
    editPinCode,
    setEditPinCode,
    editPassword,
    setEditPassword,
    editAvatar,
    setEditAvatar,
    editTelegramChatId,
    setEditTelegramChatId,
    editPatternLock,
    setEditPatternLock,
    editAllowDelayLock,
    setEditAllowDelayLock,
    newAllowDelayLock,
    setNewAllowDelayLock,
    editTheme,
    setEditTheme,
    newTheme,
    setNewTheme,
    isCameraOpen,
    setIsCameraOpen,
    isRealCamDropdownOpen,
    setIsRealCamDropdownOpen,
    cameraFacingMode,
    setCameraFacingMode,
    remoteCameraAction,
    setRemoteCameraAction,
    attachedImageBase64,
    setAttachedImageBase64,
    attachedFile,
    setAttachedFile,
    lightboxImage,
    setLightboxImage,
    lightboxCaption,
    setLightboxCaption,
    isLightboxOpen,
    setIsLightboxOpen,
    isStrictRealMode,
    setIsStrictRealMode,
    showSecurityHub,
    setShowSecurityHub,
    selectedArticle,
    setSelectedArticle,
    isAuthBioEnabled,
    setIsAuthBioEnabled,
    isAuthPinEnabled,
    setIsAuthPinEnabled,
    isAuthPwdEnabled,
    setIsAuthPwdEnabled,
    systemLogs,
    setSystemLogs,
    inspectorMessage,
    setInspectorMessage,
    inspectorUser,
    setInspectorUser,
    pipelineTransit,
    setPipelineTransit,
    playBeep,
    addLog,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    handleTogglePrefWebPush,
    handleTogglePrefTelegram,
    handleSaveNotificationConfig,
    fetchUsers,
    handleLoginReal,
    pollMessagesReal,
    handleSendRealMessage,
    handleRetryMessage,
    handleSelfDestruct,
    handleImageFileChange,
    handleCameraCapture,
    captureSilently,
    handleAuthorizeCamera1Time,
    handleSendRemoteCameraRequestReal,
    handleAcceptAndCaptureReal,
    handleDeclineCameraRequestReal,
    handleSendRemoteCameraResponse,
    handleAuthenticateReal,
    handleLockReal,
    handleResetKeysReal,
    handleLogoutReal,
    handleAdminCreateUser,
    fetchAllUsersForAdmin,
    handleAdminUpdateUser,
    handleAdminClearAllChats,
    handleToggleStrictRealMode,
    handleSaveTelegramBotToken,
    saveTokenSuccessMsg,
    saveTokenErrorMsg,
    isSavingToken,
    handleTestTelegramConnection,
    handleToggleAuthBio,
    handleToggleAuthPin,
    handleToggleAuthPwd,
    isKeySharingEnabled,
    handleToggleKeySharing,
    handleAdminUnlinkPair,
    handleAdminDeleteUser,
    isCameraRequestingRef,
    // User Profile Edit States & Handlers
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileName,
    setProfileName,
    profilePassword,
    setProfilePassword,
    profilePinCode,
    setProfilePinCode,
    profilePatternLock,
    setProfilePatternLock,
    profilePrefAuthPin,
    setProfilePrefAuthPin,
    profilePrefAuthPattern,
    setProfilePrefAuthPattern,
    isSavingProfile,
    profileSuccessMsg,
    setProfileSuccessMsg,
    profileErrorMsg,
    setProfileErrorMsg,
    openProfileModal,
    handleUpdateProfile,
    showPWAInstallPrompt,
    setShowPWAInstallPrompt,
    pwaOS,
    isPWAInstalled,
    triggerPWAInstall,
    lockDelay,
    lockAtTimestamp,
    updateLockDelayReal,
    disguiseArticleTitle,
    setDisguiseArticleTitle,
    disguiseArticleContent,
    setDisguiseArticleContent,
    isSavingDisguise,
    saveDisguiseSuccessMsg,
    saveDisguiseErrorMsg,
    handleSaveDisguiseArticle,
  } = useAppLogic();

  // Local states for the two admin features integrated into the main categories menu
  const [isAdminDeletePostingsOpen, setIsAdminDeletePostingsOpen] = useState(false);
  const [isAdminSqlQueryOpen, setIsAdminSqlQueryOpen] = useState(false);

  // Pure UI helper formatting and message content rendering
  const formatCountdown = (sec: number | null): string => {
    if (sec === null) return '';
    if (sec >= 86400) {
      const days = Math.floor(sec / 86400);
      return `${days} ngày`;
    }
    if (sec >= 3600) {
      const hrs = Math.floor(sec / 3600);
      return `${hrs} giờ`;
    }
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDestructLabel = (sec: number | null): string => {
    if (sec === null) return 'Tắt tự hủy';
    if (sec === 10) return '10 giây';
    if (sec === 300) return '5 phút';
    if (sec === 86400) return '24 giờ';
    if (sec === 604800) return '7 ngày';
    return `${sec} giây`;
  };

  const renderMessageContent = (
    decryptedText: string | null,
    isMe: boolean,
    isBioAuth: boolean,
    msg: Message,
    onQuoteClick?: (quotedId: string) => void,
    isSelectionModeActive?: boolean
  ): React.ReactNode => {
    return (
      <MessageContentRenderer
        decryptedText={decryptedText}
        isMe={isMe}
        isBioAuth={isBioAuth}
        msg={msg}
        setLightboxImage={setLightboxImage}
        setLightboxCaption={setLightboxCaption}
        setIsLightboxOpen={setIsLightboxOpen}
        onQuoteClick={onQuoteClick}
        isSelectionModeActive={isSelectionModeActive}
      />
    );
  };

  // ---------------------------------------------------------------------------
  // MAIN COMPONENT RENDER
  // ---------------------------------------------------------------------------
  if (appMode === 'real' && !realUser) {
    return (
      <EditorialLoginScreen
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        onLogin={handleLoginReal}
      />
    );
  }

  return (
    <div className={`min-h-screen ${
      realUser && activeRecipient ? 'bg-white md:bg-[#f4f5f6]' : 'bg-[#f4f5f6]'
    } text-slate-900 flex flex-col font-sans antialiased`}>
      
      {/* 1. TOP NEWS PORTAL HEADER (DÂN TRÍ CAMOUFLAGE) */}
      <div className={realUser && activeRecipient ? "hidden md:block" : "block"}>
        <NewspaperHeader
          realUser={realUser}
          onOpenDeletePostings={() => setIsAdminDeletePostingsOpen(true)}
          onOpenSqlQuery={() => setIsAdminSqlQueryOpen(true)}
          onLogout={handleLogoutReal}
        />
      </div>

      {/* Main Content Workspace */}
      <main className={`flex-1 w-full mx-auto ${
        realUser && activeRecipient ? 'p-0 md:p-6' : 'p-4 md:p-6'
      } items-stretch ${
        realUser 
          ? `max-w-[1600px] flex flex-col ${realUser && activeRecipient ? 'space-y-0 md:space-y-6' : 'space-y-6'}` 
          : 'max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6'
      }`}>
        
        {/* LEFT / CENTER STAGE (Col 1 to 9, or full-width if in real chat mode) */}
        <section className={realUser ? `flex-1 flex flex-col ${activeRecipient ? 'space-y-0 md:space-y-6' : 'space-y-6'}` : "lg:col-span-9 flex flex-col space-y-6"}>

            <div className={realUser && activeRecipient ? "w-full h-full flex flex-col" : "flex flex-col items-center justify-center py-4"}>
              
              {!realUser ? (
                /* --- LOGIN VIEW --- */
                <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 p-8 rounded-[32px] shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-emerald-950 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-100">Đăng Nhập Sử Dụng Thật</h2>
                    <p className="text-xs text-slate-400 mt-1">Hệ thống mã hóa đầu cuối phân quyền an toàn cao.</p>
                  </div>

                  {loginError && (
                    <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Tên Đăng Nhập</label>
                      <input
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLoginReal(e);
                          }
                        }}
                        placeholder="Nhập tên tài khoản truy cập"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Mật Khẩu</label>
                      <input
                        type="text"
                        autoComplete="off"
                        data-lpignore="true"
                        style={{ WebkitTextSecurity: 'disc' } as any}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLoginReal(e);
                          }
                        }}
                        placeholder="Mật khẩu tài khoản"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLoginReal()}
                      disabled={isLoggingIn}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      {isLoggingIn ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>MỞ KHÓA KÊNH TRUYỀN THẬT</span>
                        </>
                      )}
                    </button>
                  </div>


                </div>
              ) : (
                /* --- LOGGED IN USER INTERFACE (Full desktop workspace) --- */
                <div className={`relative mx-auto w-full bg-white flex flex-col overflow-hidden ${
                  activeRecipient 
                    ? 'h-screen md:h-[780px] rounded-none border-0 shadow-none md:rounded-3xl md:border md:border-slate-200 md:shadow-xl' 
                    : 'h-[780px] rounded-3xl border border-slate-200 shadow-xl'
                }`}>
                    
                    {isAdminPanelOpen ? (
                      <AdminPanel
                        setIsAdminPanelOpen={setIsAdminPanelOpen}
                        telegramBotToken={telegramBotToken}
                        setTelegramBotToken={setTelegramBotToken}
                        handleSaveTelegramBotToken={handleSaveTelegramBotToken}
                        saveTokenSuccessMsg={saveTokenSuccessMsg}
                        saveTokenErrorMsg={saveTokenErrorMsg}
                        isSavingToken={isSavingToken}
                        testTelegramChatId={testTelegramChatId}
                        setTestTelegramChatId={setTestTelegramChatId}
                        testLoading={testLoading}
                        handleTestTelegramConnection={handleTestTelegramConnection}
                        testSuccessMsg={testSuccessMsg}
                        testErrorMsg={testErrorMsg}
                        editingUser={editingUser}
                        setEditingUser={setEditingUser}
                        adminSuccessMsg={adminSuccessMsg}
                        adminErrorMsg={adminErrorMsg}
                        setAdminSuccessMsg={setAdminSuccessMsg}
                        setAdminErrorMsg={setAdminErrorMsg}
                        editName={editName}
                        setEditName={setEditName}
                        editRole={editRole}
                        setEditRole={setEditRole}
                        editPassword={editPassword}
                        setEditPassword={setEditPassword}
                        editPinCode={editPinCode}
                        setEditPinCode={setEditPinCode}
                        editAvatar={editAvatar}
                        setEditAvatar={setEditAvatar}
                        editTelegramChatId={editTelegramChatId}
                        setEditTelegramChatId={setEditTelegramChatId}
                        editPatternLock={editPatternLock}
                        setEditPatternLock={setEditPatternLock}
                        editAllowDelayLock={editAllowDelayLock}
                        setEditAllowDelayLock={setEditAllowDelayLock}
                        editTheme={editTheme}
                        setEditTheme={setEditTheme}
                        handleAdminUpdateUser={handleAdminUpdateUser}
                        newUsername={newUsername}
                        setNewUsername={setNewUsername}
                        newName={newName}
                        setNewName={setNewName}
                        newPassword={newPassword}
                        setNewPassword={setNewPassword}
                        newRole={newRole}
                        setNewRole={setNewRole}
                        newPinCode={newPinCode}
                        setNewPinCode={setNewPinCode}
                        newTelegramChatId={newTelegramChatId}
                        setNewTelegramChatId={setNewTelegramChatId}
                        newAllowDelayLock={newAllowDelayLock}
                        setNewAllowDelayLock={setNewAllowDelayLock}
                        newTheme={newTheme}
                        setNewTheme={setNewTheme}
                        handleAdminCreateUser={handleAdminCreateUser}
                        allUsersList={allUsersList}
                        isAuthBioEnabled={isAuthBioEnabled}
                        handleToggleAuthBio={handleToggleAuthBio}
                        isAuthPinEnabled={isAuthPinEnabled}
                        handleToggleAuthPin={handleToggleAuthPin}
                        isAuthPwdEnabled={isAuthPwdEnabled}
                        handleToggleAuthPwd={handleToggleAuthPwd}
                        isKeySharingEnabled={isKeySharingEnabled}
                        handleToggleKeySharing={handleToggleKeySharing}
                        handleAdminUnlinkPair={handleAdminUnlinkPair}
                        handleAdminDeleteUser={handleAdminDeleteUser}
                        disguiseArticleTitle={disguiseArticleTitle}
                        setDisguiseArticleTitle={setDisguiseArticleTitle}
                        disguiseArticleContent={disguiseArticleContent}
                        setDisguiseArticleContent={setDisguiseArticleContent}
                        isSavingDisguise={isSavingDisguise}
                        saveDisguiseSuccessMsg={saveDisguiseSuccessMsg}
                        saveDisguiseErrorMsg={saveDisguiseErrorMsg}
                        handleSaveDisguiseArticle={handleSaveDisguiseArticle}
                      />
                    ) : (
                      /* --- REAL CHAT SPLIT-PANE WORKSPACE --- */
                      <div className={`flex-1 flex overflow-hidden bg-white h-full ${
                        activeRecipient 
                          ? 'rounded-none border-0 md:rounded-3xl md:border md:border-slate-200' 
                          : 'rounded-3xl border border-slate-200'
                      }`}>
                        {/* 1. Left UserChatSidebar: visible on desktop, or on mobile when no active conversation */}
                        <div className={`${activeRecipient ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 h-full`}>
                          <UserChatSidebar
                            usersList={usersList}
                            realUser={realUser}
                            realMessages={realMessages}
                            activeRecipient={activeRecipient}
                            setActiveRecipient={setActiveRecipient}
                            setIsAdminPanelOpen={setIsAdminPanelOpen}
                            handleLockReal={handleLockReal}
                            handleLogoutReal={handleLogoutReal}
                            fetchUsers={fetchUsers}
                            onOpenNotificationConfig={() => setIsNotificationModalOpen(true)}
                            onOpenProfileEdit={openProfileModal}
                            isPWAInstalled={isPWAInstalled}
                            onOpenPWAInstall={() => setShowPWAInstallPrompt(true)}
                            lockDelay={lockDelay}
                            lockAtTimestamp={lockAtTimestamp}
                            updateLockDelayReal={updateLockDelayReal}
                            isKeySharingEnabled={isKeySharingEnabled}
                            setRealUser={setRealUser}
                            addLog={addLog}
                          />
                        </div>

                        {/* 2. Right Chat Screen: visible on desktop, or on mobile when a conversation is active */}
                        <div className={`${activeRecipient ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-slate-50/50 overflow-hidden relative border-l border-slate-200`}>
                          {activeRecipient ? (
                            <ChatArea
                              activeRecipient={activeRecipient}
                              setActiveRecipient={setActiveRecipient}
                              setAttachedImageBase64={setAttachedImageBase64}
                              attachedImageBase64={attachedImageBase64}
                              attachedFile={attachedFile}
                              setAttachedFile={setAttachedFile}
                              realUser={realUser}
                              realMessages={realMessages}
                              hasMoreMessages={hasMoreMessages}
                              isLoadingOlder={isLoadingOlder}
                              loadOlderMessages={loadOlderMessages}
                              showSecurityHub={showSecurityHub}
                              setShowSecurityHub={setShowSecurityHub}
                              handleLockReal={handleLockReal}
                              isCameraAuthorizedReal={isCameraAuthorizedReal}
                              setIsCameraAuthorizedReal={setIsCameraAuthorizedReal}
                              handleAuthorizeCamera1Time={handleAuthorizeCamera1Time}
                              formatCountdown={formatCountdown}
                              setInspectorMessage={setInspectorMessage}
                              renderMessageContent={renderMessageContent}
                              isRealDestructOpen={isRealDestructOpen}
                              setIsRealDestructOpen={setIsRealDestructOpen}
                              realSelfDestruct={realSelfDestruct}
                              setRealSelfDestruct={setRealSelfDestruct}
                              formatDestructLabel={formatDestructLabel}
                              handleImageFileChange={handleImageFileChange}
                              isRealCamDropdownOpen={isRealCamDropdownOpen}
                              setIsRealCamDropdownOpen={setIsRealCamDropdownOpen}
                              isCameraRequestingRef={isCameraRequestingRef}
                              setCameraTriggerSource={setCameraTriggerSource}
                              setCameraFacingMode={setCameraFacingMode}
                              setIsCameraOpen={setIsCameraOpen}
                              handleSendRemoteCameraRequestReal={handleSendRemoteCameraRequestReal}
                              realInputRef={realInputRef}
                              realInput={realInput}
                              setRealInput={setRealInput}
                              handleSendRealMessage={handleSendRealMessage}
                              handleRetryMessage={handleRetryMessage}
                              addLog={addLog}
                              systemLogs={systemLogs}
                              isPushSubscribed={isPushSubscribed}
                              unsubscribeUserFromPush={unsubscribeUserFromPush}
                              subscribeUserToPush={subscribeUserToPush}
                              prefWebPush={prefWebPush}
                              handleTogglePrefWebPush={handleTogglePrefWebPush}
                              prefTelegram={prefTelegram}
                              handleTogglePrefTelegram={handleTogglePrefTelegram}
                              setRealMessages={setRealMessages}
                              handleSelfDestruct={handleSelfDestruct}
                              usersList={usersList}
                              setUsersList={setUsersList}
                              disguiseArticleTitle={disguiseArticleTitle}
                              disguiseArticleContent={disguiseArticleContent}
                            />
                          ) : (
                            /* --- CHAT PLACEHOLDER SCREEN --- */
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fafbfe] select-none animate-fade-in">
                              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#005699] shadow-sm mb-4 animate-pulse">
                                <MessageSquare className="w-8 h-8" />
                              </div>
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">HÒM THƯ BẢO MẬT E2EE</h3>
                              <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                                Vui lòng chọn một người dùng từ danh sách ở phía bên trái để thiết lập liên kết khóa đối xứng AES-256 và bắt đầu nhắn tin mã hóa đầu cuối.
                              </p>
                              <div className="mt-6 flex items-center space-x-1.5 text-[9px] text-emerald-700 font-mono bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/85 shadow-sm">
                                <Shield className="w-3.5 h-3.5" />
                                <span>AES-GCM-256 & RSA-2048 SHIELD ACTIVE</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* MODAL CẤU HÌNH KÊNH TRUYỀN THÔNG TIN BÀI (PWA & TELEGRAM) */}
                    {isNotificationModalOpen && (
                      <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90%]">
                          {/* Header */}
                          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#008075]/10 border border-[#008075]/25 flex items-center justify-center text-[#008075]">
                                <Bell className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Kênh Nhận Tin Bài</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">CHANNEL PREFERENCES</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setIsNotificationModalOpen(false);
                                setNotificationConfigSuccess(null);
                                setNotificationConfigError(null);
                              }}
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Body */}
                          <div className="p-5 space-y-5 overflow-y-auto">
                            {/* Alert messages */}
                            {notificationConfigSuccess && (
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium text-left">
                                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                                <span>{notificationConfigSuccess}</span>
                              </div>
                            )}

                            {notificationConfigError && (
                              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium text-left">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                <span>{notificationConfigError}</span>
                              </div>
                            )}

                            {/* Channel 1: PWA Web Push */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                  <Smartphone className="w-4 h-4 text-[#008075]" />
                                  <span>Thông báo PWA (Web Push)</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPrefWebPush(!prefWebPush)}
                                  className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${prefWebPush ? 'bg-[#008075]' : 'bg-slate-200'}`}
                                >
                                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: prefWebPush ? 'translateX(20px)' : 'translateX(2px)' }} />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                Nhận tin tức "Bài đăng mới" tức thời thông qua thông báo đẩy PWA của trình duyệt trên điện thoại hoặc máy tính.
                              </p>

                              {/* Device subscription link state */}
                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-mono">Trạng thái thiết bị:</span>
                                <div className="flex items-center gap-2">
                                  {isPushSubscribed ? (
                                    <>
                                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> ĐÃ LIÊN KẾT
                                      </span>
                                      <button
                                        type="button"
                                        onClick={unsubscribeUserFromPush}
                                        className="text-[9px] font-bold text-red-600 hover:underline"
                                      >
                                        Hủy liên kết
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-amber-600 font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> CHƯA LIÊN KẾT
                                      </span>
                                      <button
                                        type="button"
                                        onClick={subscribeUserToPush}
                                        className="text-[9px] font-bold text-[#008075] hover:underline"
                                      >
                                        Liên kết ngay
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Channel 2: Telegram */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                  <Send className="w-4 h-4 text-[#0088cc]" />
                                  <span>Thông báo Telegram</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPrefTelegram(!prefTelegram)}
                                  className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${prefTelegram ? 'bg-[#0088cc]' : 'bg-slate-200'}`}
                                >
                                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: prefTelegram ? 'translateX(20px)' : 'translateX(2px)' }} />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                Nhận tin tức và thông tin truyền tin bảo mật qua kênh Telegram cá nhân khi bạn không online trên hệ thống.
                              </p>

                              {/* Telegram Chat ID Configuration */}
                              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Telegram Chat ID cá nhân</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Ví dụ: 123456789"
                                    className="flex-1 text-[11px] bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#0088cc]/30"
                                    value={userTelegramChatIdInput}
                                    onChange={(e) => setUserTelegramChatIdInput(e.target.value.replace(/\D/g, ''))}
                                  />
                                </div>
                                <div className="p-2.5 bg-[#0088cc]/5 border border-[#0088cc]/10 rounded-xl space-y-1 text-[9px] text-slate-500 leading-relaxed">
                                  <span className="font-bold text-[#0088cc] uppercase font-mono block">Hướng dẫn lấy Chat ID:</span>
                                  <p>1. Tìm bot <strong className="text-slate-700 font-mono">@userinfobot</strong> trên Telegram và gửi tin nhắn bất kỳ để lấy ID của bạn.</p>
                                  <p>2. Khởi chạy bot của hệ thống bằng cách tìm kiếm bot của dự án và nhấn <strong className="text-slate-700 font-mono">/start</strong> để cho phép nhận tin nhắn.</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer actions */}
                          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setIsNotificationModalOpen(false);
                                setNotificationConfigSuccess(null);
                                setNotificationConfigError(null);
                              }}
                              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-150 rounded-xl transition-all"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              onClick={handleSaveNotificationConfig}
                              disabled={isSavingNotificationConfig}
                              className="px-4 py-2 text-xs font-bold text-white bg-[#008075] hover:bg-[#00665d] rounded-xl shadow-md transition-all flex items-center gap-1.5"
                            >
                              {isSavingNotificationConfig ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang lưu...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Lưu cấu hình</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODAL CẤU HÌNH THÔNG TIN TÀI KHOẢN CÁ NHÂN */}
                    {isProfileModalOpen && (
                      <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90%]">
                          {/* Header */}
                          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#005699]/10 border border-[#005699]/25 flex items-center justify-center text-[#005699]">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Cấu hình cá nhân</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ACCOUNT PROFILE SETTINGS</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setIsProfileModalOpen(false);
                                setProfileSuccessMsg(null);
                                setProfileErrorMsg(null);
                              }}
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Body */}
                          <form onSubmit={handleUpdateProfile} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-left">
                              {/* Alerts */}
                              {profileSuccessMsg && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium">
                                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                                  <span>{profileSuccessMsg}</span>
                                </div>
                              )}

                              {profileErrorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                  <span>{profileErrorMsg}</span>
                                </div>
                              )}

                              {/* Username (Disabled) */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase">Tên tài khoản (Không thể sửa)</label>
                                <input
                                  type="text"
                                  disabled
                                  className="w-full text-xs bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 font-mono cursor-not-allowed"
                                  value={realUser.username}
                                />
                              </div>

                              {/* Display Name */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Tên hiển thị tác giả</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nhập tên hiển thị..."
                                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#005699]/30"
                                  value={profileName}
                                  onChange={(e) => setProfileName(e.target.value)}
                                />
                              </div>

                              {/* New Password */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Mật khẩu mới</label>
                                  <span className="text-[9px] text-slate-400 italic font-sans">Để trống nếu không muốn đổi</span>
                                </div>
                                <input
                                  type="password"
                                  placeholder="Nhập mật khẩu mới..."
                                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#005699]/30"
                                  value={profilePassword}
                                  onChange={(e) => setProfilePassword(e.target.value)}
                                />
                              </div>

                              {/* New PIN Code */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Mã PIN mở khóa</label>
                                  <span className="text-[9px] text-slate-400 italic font-sans">Để trống nếu không muốn đổi</span>
                                </div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={6}
                                  placeholder="Ví dụ: 1234"
                                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#005699]/30"
                                  value={profilePinCode}
                                  onChange={(e) => setProfilePinCode(e.target.value.replace(/\D/g, ''))}
                                />
                              </div>

                              {/* Refocus Authentication Preferences */}
                              <div className="space-y-2 border-t border-dashed border-slate-200 pt-3">
                                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Hình thức bảo mật sau khi bị lost focus</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                                    <input
                                      type="checkbox"
                                      checked={profilePrefAuthPin}
                                      onChange={(e) => setProfilePrefAuthPin(e.target.checked)}
                                      className="w-4 h-4 rounded text-[#005699] border-slate-300 focus:ring-[#005699]"
                                    />
                                    <div className="text-left select-none">
                                      <span className="block text-[11px] font-bold text-slate-700">Mã PIN</span>
                                      <span className="block text-[9px] text-slate-400">Yêu cầu mã PIN 4 số</span>
                                    </div>
                                  </label>

                                  <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                                    <input
                                      type="checkbox"
                                      checked={profilePrefAuthPattern}
                                      onChange={(e) => setProfilePrefAuthPattern(e.target.checked)}
                                      className="w-4 h-4 rounded text-[#005699] border-slate-300 focus:ring-[#005699]"
                                    />
                                    <div className="text-left select-none">
                                      <span className="block text-[11px] font-bold text-slate-700">Vẽ hình</span>
                                      <span className="block text-[9px] text-slate-400">Yêu cầu vẽ mẫu hình</span>
                                    </div>
                                  </label>
                                </div>
                              </div>

                              {/* Pattern Lock Security Setup */}
                              <PatternSetupComponent
                                patternLock={profilePatternLock}
                                onChangePattern={(pat) => setProfilePatternLock(pat || '')}
                                label="Đăng ký mã vẽ bảo mật riêng bạn"
                                userId={realUser?.id}
                              />
                            </div>

                            {/* Footer actions */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProfileModalOpen(false);
                                  setProfileSuccessMsg(null);
                                  setProfileErrorMsg(null);
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-150 rounded-xl transition-all"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="px-4 py-2 text-xs font-bold text-white bg-[#005699] hover:bg-[#004080] rounded-xl shadow-md transition-all flex items-center gap-1.5"
                              >
                                {isSavingProfile ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang lưu...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Lưu thay đổi</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Screen lock screens for real user */}
                    {!realUser.isAppUnlocked && (
                      <ScreenLockOverlay
                        user={realUser}
                        onAuthenticate={handleAuthenticateReal}
                        onResetKeys={handleResetKeysReal}
                        defaultAuthMode={realDefaultAuthMode}
                        forcePasswordOnly={realForcePasswordOnly}
                        isPinEnabled={isAuthPinEnabled}
                        isPasswordEnabled={isAuthPwdEnabled}
                      />
                    )}

                  </div>
              )}

            </div>

          {/* THỜI BÁO AN NINH SỐ EDITORIAL SECTION */}
          <div className={`bg-white border border-slate-200/95 rounded-3xl p-6 space-y-6 mt-6 shadow-sm ${
            realUser && activeRecipient ? 'hidden md:block' : 'block'
          }`}>
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#005699]/10 border border-[#005699]/20 flex items-center justify-center text-[#005699] shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Thời Báo An Ninh Số
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiến thức chuyên sâu về cơ chế mật mã học, sinh trắc học và tự hủy thông tin trực quan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EDITORIAL_ARTICLES.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-[#fafbfe]/80 hover:bg-white border border-slate-200/80 hover:border-blue-300/60 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col group h-full shadow-sm"
                >
                  <div className="aspect-[16/10] overflow-hidden relative shrink-0">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur border border-slate-200 text-[9px] font-bold text-[#005699] px-2 py-0.5 rounded-full font-mono shadow-sm">
                      {article.category}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1 space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#005699] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed flex-1">
                      {article.summary}
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <span>{article.time}</span>
                      <span className="text-blue-600 flex items-center space-x-1 group-hover:underline">
                        <span>Đọc bài</span>
                        <BookOpen className="w-3 h-3 animate-pulse" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* RIGHT SIDEBAR: KEY MANAGEMENT & SECURITY LOGS PANEL */}
        {!(appMode === 'real' && realUser) && (
          <section className="lg:col-span-3 flex flex-col space-y-6">
          
          {/* Key Management / Crypto Hub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-[#005699] pb-2 border-b border-slate-100">
              <Cpu className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono">
                Bảng quản lý khóa an toàn
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Tài khoản hiện tại:</span>
                    <span className="text-emerald-600 font-bold">{realUser ? realUser.name : 'Chưa đăng nhập'}</span>
                  </div>
                  {realUser && (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded text-[10px] text-slate-600 break-all leading-normal max-h-[70px] overflow-y-auto">
                      <p className="text-slate-500 font-bold mb-1">Mã khóa SPKI Public Key:</p>
                      {realUser.publicKeySpki || 'Chưa khởi tạo khóa.'}
                    </div>
                  )}
                </div>
              </div>

              {!isStrictRealMode && (
                <div className="bg-emerald-50 border border-emerald-200/85 p-3 rounded-xl space-y-1 text-[10px] text-emerald-850 font-sans leading-relaxed shadow-sm">
                  <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cơ chế bảo mật E2EE:</span>
                  </div>
                  <p className="text-emerald-700/90 text-[10px]">
                    Bản mã hóa được đóng gói tại client. Kể cả máy chủ hay quản trị viên cũng không thể đọc nội dung tin nhắn/hình ảnh do không có Khóa riêng tư RSA lưu cục bộ.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Security Network Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col flex-1 min-h-[260px] max-h-[480px] shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800">
                <Terminal className="w-4 h-4 text-[#005699]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono">
                  Giao thức truyền tin bảo mật
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 font-mono text-[10px] text-left pr-1 scrollbar-thin">
              {systemLogs.map((log) => {
                let badgeColor = 'bg-slate-100 text-slate-500';
                let textColor = 'text-slate-600';
                if (log.type === 'success') {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/85';
                  textColor = 'text-emerald-800';
                } else if (log.type === 'warn') {
                  badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200/85';
                  textColor = 'text-amber-800';
                } else if (log.type === 'crypto') {
                  badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200/85';
                  textColor = 'text-purple-800';
                }

                return (
                  <div key={log.id} className="space-y-0.5 leading-relaxed">
                    <div className="flex items-center space-x-1.5 select-none">
                      <span className="text-[9px] text-slate-400">{log.time}</span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${badgeColor}`}>
                        {log.type === 'crypto' ? 'CIPHER' : log.type}
                      </span>
                    </div>
                    <p className={`${textColor} pl-0.5`}>{log.text}</p>
                  </div>
                );
              })}

              {systemLogs.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-center select-none py-10">
                  <p>Hệ thống bảo mật đang tải...</p>
                </div>
              )}
            </div>
          </div>

        </section>
        )}

      </main>

      {/* CAMERA MODAL */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        defaultFacingMode={cameraFacingMode}
      />

      {/* IMAGE LIGHTBOX */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={lightboxImage}
        captionText={lightboxCaption}
        userEmail={realUser?.username || "phong"}
        isAdmin={realUser?.role === 'admin' || realUser?.username === 'phong'}
      />

      {/* ARTICLE READER MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Banner / Header Image */}
              <div className="h-48 md:h-56 relative overflow-hidden shrink-0">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {selectedArticle.category}
                  </span>
                  <h2 className="text-base md:text-lg font-bold text-slate-100 mt-2 tracking-tight leading-snug">
                    {selectedArticle.title}
                  </h2>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 text-xs text-slate-300 leading-relaxed scrollbar-thin">
                <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono pb-4 border-b border-slate-850">
                  <span>Tác giả: <strong>{selectedArticle.author}</strong></span>
                  <span>•</span>
                  <span>{selectedArticle.time}</span>
                </div>

                <div className="text-slate-200 font-medium text-[12px] bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60 leading-relaxed italic">
                  "{selectedArticle.summary}"
                </div>

                {/* Article Body Content */}
                <div className="space-y-4 pt-2 whitespace-pre-wrap text-slate-300">
                  {selectedArticle.content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('Quy trình') || paragraph.startsWith('Liên kết') || paragraph.startsWith('Triệt tiêu') || paragraph.startsWith('Sự khác biệt') || paragraph.startsWith('Tại sao')) {
                      return (
                        <h4 key={index} className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono pt-2">
                          {paragraph}
                        </h4>
                      );
                    }
                    if (paragraph.match(/^\d\./) || paragraph.startsWith('- ')) {
                      return (
                        <div key={index} className="bg-slate-950/20 border-l-2 border-emerald-500/40 pl-3.5 py-1 my-2 text-slate-300 font-mono">
                          {paragraph}
                        </div>
                      );
                    }
                    return (
                      <p key={index} className="leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-950 border-t border-slate-850 p-4 px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Nguồn: Ban Bảo Mật SecureCrypt</span>
                </span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl transition-all"
                >
                  ĐÃ HIỂU
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WEB NOTIFICATION TOAST */}
      <AnimatePresence>
        {webNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 ring-1 ring-slate-900/5 text-left font-sans"
          >
            <div className="bg-[#e6f0fa] text-[#005699] p-2.5 rounded-xl shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold text-[#005699] font-mono uppercase tracking-wider">Thông báo tòa soạn</div>
              <p className="text-[12px] font-bold text-slate-800 mt-1 leading-relaxed">
                {webNotification.message}
              </p>
            </div>
            <button
              onClick={() => setWebNotification(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN OVERLAYS / MODALS */}
      <AdminDeletePostingsModal
        isOpen={isAdminDeletePostingsOpen}
        onClose={() => setIsAdminDeletePostingsOpen(false)}
        realUser={realUser}
        addLog={addLog}
      />
      
      <AdminSqlQueryModal
        isOpen={isAdminSqlQueryOpen}
        onClose={() => setIsAdminSqlQueryOpen(false)}
        realUser={realUser}
        addLog={addLog}
      />

      {/* SMART PWA INSTALL PROMPT */}
      <PWAInstallPromptModal
        isOpen={showPWAInstallPrompt}
        onClose={() => setShowPWAInstallPrompt(false)}
        pwaOS={pwaOS}
        onInstall={triggerPWAInstall}
      />

      {/* FOOTER */}
      <footer className={`border-t border-slate-900 bg-slate-950 py-4 px-6 mt-auto text-center text-[10px] text-slate-600 font-mono ${
        realUser && activeRecipient ? 'hidden md:block' : 'block'
      }`}>
        <p>© 2026 SecureCrypt E2EE Hub. Tất cả dữ liệu và khóa giải mã được cô lập tuyệt đối trên thiết bị của người dùng.</p>
      </footer>
    </div>
  );
}
