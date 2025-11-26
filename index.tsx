import React, { useState, useRef, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { toCanvas } from "html-to-image";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { 
  Wifi, 
  BatteryFull, 
  Signal, 
  ChevronLeft, 
  MoreHorizontal, 
  Mic, 
  Smile, 
  PlusCircle, 
  Download,
  Trash2,
  Send,
  User,
  Clock,
  Settings,
  MessageSquarePlus,
  Image as ImageIcon,
  Heart,
  Star,
  MessageCircle,
  Share2,
  MapPin,
  Search,
  ArrowLeft,
  CornerDownRight,
  X,
  Phone,
  Video,
  Calendar,
  Bell,
  Lightbulb,
  Type,
  Maximize,
  Volume2,
  Info, 
  Camera, 
  List, 
  MessageSquare, 
  ThumbsUp,
  ChevronRight,
  Eye,
  MessageSquareText
} from "lucide-react";

// --- Constants ---
const inputFieldClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition";
const inputAreaClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] resize-none";

// --- Types ---

type Mode = "message" | "post" | "forum";
type MessageMode = "wechat" | "sms";
type MessageType = "me" | "other" | "time" | "system" | "image" | "voice" | "call";

interface Message {
  id: string;
  type: MessageType;
  content: string; 
  sender?: "me" | "other";
  meta?: {
    duration?: string; 
    transcription?: string; 
    callType?: "voice" | "video";
    callState?: "active" | "cancelled" | "missed";
    width?: number;
  };
}

interface PhoneGlobalConfig {
  time: string;
  battery: number;
  showStatus: boolean;
}

interface ChatConfig {
  nickname: string;
  bgImage: string;
  fontSize: number; 
  myAvatar: string;
  otherAvatar: string;
}

// RedNote/Post Types
interface Reply {
  id: string;
  nickname: string;
  content: string;
  likes: number;
  avatarSeed: number;
  targetName?: string;
}

interface Comment {
  id: string;
  nickname: string;
  content: string;
  likes: number;
  avatarSeed: number;
  replies: Reply[];
}

interface PostConfig {
  authorName: string;
  title: string;
  content: string;
  tags: string;
  dateLocation: string;
  likeCount: string;
  collectCount: string;
  commentCount: string;
  imageUrl: string;
}

// Forum/BBS Types
interface ForumReply {
  id: string;
  floor: number;
  nickname: string;
  content: string;
  time: string;
  isOp: boolean; // Is original poster (Landlord)
  likes: number;
  quote?: string; // Content of the post being quoted
  quoteTargetNickname?: string; // The nickname of the user being quoted
}

interface ForumConfig {
  boardName: string; // e.g., "情感天地"
  title: string;
  opNickname: string;
  opContent: string;
  opImage: string; // 楼主正文图片
  viewCount: string;
  replyCount: string;
}

// --- Icons & Assets ---

const BatteryIcon = ({ level }: { level: number }) => (
  <div className="relative w-[22px] h-[10px] rounded-[2.5px] border border-[#333] p-[1px] mr-1">
    <div 
      className={`h-full rounded-[1.5px] ${level <= 20 ? 'bg-red-500' : 'bg-black'}`} 
      style={{ width: `${Math.max(5, Math.min(100, level))}%` }}
    />
    <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] bg-[#333] rounded-r-[1px]" />
  </div>
);

const VoiceWave = ({ isMe }: { isMe: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isMe ? 'text-black' : 'text-gray-500'} flex-shrink-0`}>
    {isMe ? (
      <>
        <path d="M15 12C15 12.55 15.45 13 16 13C16.55 13 17 12.55 17 12C17 11.45 16.55 11 16 11C15.45 11 15 11.45 15 12Z" fill="currentColor" />
        <path d="M12 7.75732C10.8284 8.9289 10.8284 10.8284 10.8284 12C10.8284 13.1715 10.8284 15.071 12 16.2426" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9.17157 4.92893C7.21895 6.88155 7.21895 10.0474 7.21895 12C7.21895 13.9526 7.21895 17.1184 9.17157 19.0711" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6.34315 2.1005C3.60948 4.83417 3.60948 9.26633 3.60948 12C3.60948 14.7337 3.60948 19.1658 6.34315 21.8995" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
         <path d="M8 12C8 12.55 7.55 13 7 13C6.45 13 6 12.55 6 12C6 11.45 6.45 11 7 11C7.55 11 8 11.45 8 12Z" fill="currentColor" />
         <path d="M12 7.75732C13.1716 8.9289 13.1716 10.8284 13.1716 12C13.1716 13.1715 13.1716 15.071 12 16.2426" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
         <path d="M14.8284 4.92893C16.7811 6.88155 16.7811 10.0474 16.7811 12C16.7811 13.9526 16.7811 17.1184 14.8284 19.0711" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
         <path d="M17.6569 2.1005C20.3905 4.83417 20.3905 9.26633 20.3905 12C20.3905 14.7337 20.3905 19.1658 17.6569 21.8995" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const Avatar = ({ type, seed = 1 }: { type: 'me' | 'other' | 'author' | 'random', seed?: number }) => {
  let gradientId = `grad-${type}-${seed}`;
  let colorStart, colorEnd;

  if (type === 'me') {
    colorStart = '#4ade80'; colorEnd = '#22c55e';
  } else if (type === 'other') {
    colorStart = '#f3f4f6'; colorEnd = '#d1d5db'; 
  } else if (type === 'author') {
    colorStart = '#f472b6'; colorEnd = '#db2777';
  } else {
    const colors = [
      ['#f87171', '#ef4444'], ['#fb923c', '#f97316'], ['#a78bfa', '#8b5cf6'], ['#2dd4bf', '#14b8a6']
    ];
    // Ensure seed is positive integer
    const safeSeed = Math.abs(Math.floor(seed)) || 1;
    [colorStart, colorEnd] = colors[safeSeed % colors.length];
  }
  
  if (type === 'other') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full bg-[#E5E7EB]">
             <circle cx="50" cy="40" r="18" fill="white" />
             <path d="M20 90 Q50 60 80 90" fill="white" />
        </svg>
      )
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full bg-[#f0f0f0]">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: colorStart, stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: colorEnd, stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      <circle cx="50" cy="40" r="18" fill="white" fillOpacity="0.9" />
      <path d="M20 90 Q50 60 80 90" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.9" />
    </svg>
  );
};

const Watermark = () => (
  <div className="w-full text-center py-6">
    <span className="text-[10px] text-gray-300 font-mono tracking-widest opacity-60">
      Powered by Nova
    </span>
  </div>
);

// --- Components ---

const App = () => {
  const [activeTab, setActiveTab] = useState<Mode>("message");
  const [messageMode, setMessageMode] = useState<MessageMode>("wechat");

  // Global Config
  const [globalConfig, setGlobalConfig] = useState<PhoneGlobalConfig>({
    time: "14:21",
    battery: 88,
    showStatus: true,
  });

  // Chat & SMS Share the same message state, but different config
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    nickname: "文件传输助手",
    bgImage: "",
    fontSize: 16,
    myAvatar: "",
    otherAvatar: "",
  });
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'time', content: '14:20' },
    { id: '2', type: 'other', content: '捡手机文学素材生成器？' },
    { id: '3', type: 'me', content: '是的，支持微信、论坛、短信多种模式。' },
    { id: '4', type: 'voice', content: '', sender: 'other', meta: { duration: '4"', transcription: '计划通。' },  }
  ]);
  
  // Input State
  const [activeTool, setActiveTool] = useState<"text" | "photo" | "call" | "voice" | "system" | "date" | "font">("text");
  const [chatInput, setChatInput] = useState("");
  const [photoImageUrl, setPhotoImageUrl] = useState(""); // 图片工具专用的图片URL/Base64
  
  // Avatar Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropTarget, setCropTarget] = useState<"myAvatar" | "otherAvatar" | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 切换工具时的处理函数
  const handleToolChange = (toolId: "text" | "photo" | "call" | "voice" | "system" | "date" | "font") => {
    setActiveTool(toolId);
    // 切换到非图片工具时，清空输入（图片工具使用独立的 photoImageUrl）
    if (toolId !== 'photo') {
      setChatInput("");
    }
  };
  const [chatSender, setChatSender] = useState<"me" | "other">("other");
  const [imageWidth, setImageWidth] = useState(100);
  const [voiceDuration, setVoiceDuration] = useState(10);
  const [voiceTranscription, setVoiceTranscription] = useState("");
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [callState, setCallState] = useState<"active" | "cancelled" | "missed">("active");
  const [callDuration, setCallDuration] = useState("00:05");
  const [inspirationOpen, setInspirationOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Post (RedNote) State
  const [postConfig, setPostConfig] = useState<PostConfig>({
    authorName: "Momo",
    title: "关于我捡到一个手机这件事",
    content: "今天在路边捡到一个手机，打开一看竟然是...",
    tags: "#捡手机 #文学",
    dateLocation: "昨天 23:44 · 上海",
    likeCount: "1.2w",
    collectCount: "520",
    commentCount: "108",
    imageUrl: "" 
  });
  const [comments, setComments] = useState<Comment[]>([
    { 
      id: '1', 
      nickname: '路人甲', 
      content: '蹲一个后续！', 
      likes: 128, 
      avatarSeed: 1, 
      replies: [
        { id: 'r1', nickname: 'Momo', content: '更新啦，快去看！', likes: 12, avatarSeed: 99 }
      ] 
    },
  ]);
  
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string>("");
  const [newComment, setNewComment] = useState({ nickname: "网友", content: "", likes: 0 });

  // Forum (BBS) State
  const [forumConfig, setForumConfig] = useState<ForumConfig>({
    boardName: "情感天地",
    title: "【求助】捡到一个没锁的手机，看到备忘录我惊了",
    opNickname: "无名氏",
    opContent: "如题，楼主现在手在发抖，不知道该不该报警。备忘录里写着...",
    opImage: "",
    viewCount: "5821",
    replyCount: "32"
  });
  
  const [forumReplies, setForumReplies] = useState<ForumReply[]>([
    { id: 'f2', floor: 2, nickname: '沙发', content: '前排吃瓜，快更！', time: '1分钟前', isOp: false, likes: 5 },
    { id: 'f3', floor: 3, nickname: '无名氏', content: '别催，我正在整理图片', time: '刚刚', isOp: true, likes: 12, quote: "前排吃瓜，快更！", quoteTargetNickname: "沙发" }
  ]);

  const [newForumReply, setNewForumReply] = useState({ 
    nickname: "路人", 
    content: "", 
    isOp: false, 
    quote: "",
    quoteTargetNickname: "" 
  });

  const previewRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (activeTab === 'message' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeTab, messageMode]);

  // 更新预览 canvas
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = 96 * pixelRatio;
    canvas.height = 96 * pixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      96,
      96
    );
  }, [completedCrop]);

  const getScreenBgClass = () => {
    switch (activeTab) {
      case "message": return messageMode === 'wechat' ? "bg-[#EDEDED]" : "bg-white";
      case "forum": return "bg-[#F5F5F7]";
      default: return "bg-white";
    }
  };

  const getStatusBarClass = () => {
    switch (activeTab) {
      case "message": return messageMode === 'wechat' ? "bg-[#EDEDED] text-black" : "bg-white/90 backdrop-blur text-black";
      case "forum": return "bg-[#F9F9F9] text-black";
      default: return "bg-white/90 backdrop-blur text-black";
    }
  };

  // --- Handlers ---

  // 打开头像裁剪弹窗
  const openCropModal = (imageSrc: string, target: "myAvatar" | "otherAvatar") => {
    setCropImageSrc(imageSrc);
    setCropTarget(target);
    setCropModalOpen(true);
    setCrop(undefined);
  };

  // 关闭裁剪弹窗
  const closeCropModal = () => {
    setCropModalOpen(false);
    setCropImageSrc("");
    setCropTarget(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // 图片加载完成时设置默认裁剪区域
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // 1:1 比例
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  // 执行裁剪并保存
  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !cropTarget) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    const croppedImageUrl = canvas.toDataURL('image/png');
    
    setChatConfig(prev => {
      if (cropTarget === 'myAvatar') {
        return {...prev, myAvatar: croppedImageUrl};
      } else {
        return {...prev, otherAvatar: croppedImageUrl};
      }
    });
    
    closeCropModal();
  }, [completedCrop, cropTarget]);

  const addChatMessage = () => {
    const id = Date.now().toString();
    let newMsg: Message | null = null;

    if (activeTool === 'text') {
       if (!chatInput.trim()) return;
       newMsg = { id, type: chatSender, content: chatInput };
    } else if (activeTool === 'photo') {
       if (!photoImageUrl.trim()) return;
       newMsg = { id, type: 'image', sender: chatSender, content: photoImageUrl, meta: { width: imageWidth } };
    } else if (activeTool === 'voice') {
       newMsg = { id, type: 'voice', sender: chatSender, content: '', meta: { duration: `${voiceDuration}"`, transcription: voiceTranscription } };
    } else if (activeTool === 'call') {
       newMsg = { id, type: 'call', sender: chatSender, content: '', meta: { callType, callState, duration: callDuration } };
    } else if (activeTool === 'system') {
       if (!chatInput.trim()) return;
       newMsg = { id, type: 'system', content: chatInput };
    } else if (activeTool === 'date') {
       newMsg = { id, type: 'time', content: chatInput || globalConfig.time };
    }

    if (newMsg) {
       setMessages([...messages, newMsg]);
       if (activeTool === 'text' || activeTool === 'system') {
         setChatInput("");
       } else if (activeTool === 'photo') {
         setPhotoImageUrl("");
       }
    }
  };

  const addComment = () => {
    if (!newComment.content.trim()) return;
    const id = Date.now().toString();
    const commentData: Reply = {
      id,
      nickname: newComment.nickname,
      content: newComment.content,
      likes: newComment.likes,
      avatarSeed: Math.floor(Math.random() * 10),
      targetName: replyTargetName || undefined
    };

    if (replyingToId) {
      setComments(comments.map(c => {
        if (c.id === replyingToId) {
          return { ...c, replies: [...c.replies, commentData] };
        }
        return c;
      }));
      setReplyingToId(null); 
      setReplyTargetName("");
    } else {
      setComments([...comments, { ...commentData, replies: [] }]);
    }
    setNewComment({ ...newComment, content: "", likes: 0 });
  };

  const addForumReply = () => {
    if (!newForumReply.content.trim()) return;
    const maxFloor = forumReplies.length > 0 ? Math.max(...forumReplies.map(r => r.floor)) : 1;
    const newReply: ForumReply = {
      id: Date.now().toString(),
      floor: maxFloor + 1,
      nickname: newForumReply.nickname,
      content: newForumReply.content,
      time: "刚刚",
      isOp: newForumReply.isOp,
      likes: 0,
      quote: newForumReply.quote || undefined,
      quoteTargetNickname: newForumReply.quoteTargetNickname || undefined
    };
    setForumReplies([...forumReplies, newReply]);
    setNewForumReply({ ...newForumReply, content: "", quote: "", quoteTargetNickname: "" });
  };

  const handleForumReplyClick = (target: { id: string, nickname: string, content: string } | null) => {
    if (!target) {
        setNewForumReply({...newForumReply, quote: "", quoteTargetNickname: ""});
        return;
    }
    // Truncate quote content to reasonable length
    const truncatedContent = target.content.length > 60 ? target.content.substring(0, 60) + "..." : target.content;
    setNewForumReply({
        ...newForumReply,
        quote: truncatedContent,
        quoteTargetNickname: target.nickname
    });
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      // 等待字体加载完成
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      
      // 检测是否为 iOS 设备
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // iOS Safari 需要特殊处理：临时替换阴影样式
      if (isIOS) {
        const shadowElements = previewRef.current.querySelectorAll('.shadow-sm');
        shadowElements.forEach((el) => {
           const htmlEl = el as HTMLElement;
           // 保存原始样式
           htmlEl.dataset.originalBoxShadow = htmlEl.style.boxShadow;
           htmlEl.dataset.originalFilter = htmlEl.style.filter;
           
           // 应用 SVG filter
           htmlEl.style.boxShadow = 'none';
           htmlEl.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))';
        });
      }

      // 使用 toCanvas 方法，对 iOS Safari 的 box-shadow 兼容性更好
      const canvas = await toCanvas(previewRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: false,
        backgroundColor: '#EDEDED',
        // iOS Safari 需要特殊处理
        style: isIOS ? {
          // 强制使用硬件加速，改善渲染质量
          transform: 'translateZ(0)',
        } : undefined,
      });
      
      // 恢复原始样式
      if (isIOS) {
        const shadowElements = previewRef.current.querySelectorAll('.shadow-sm');
        shadowElements.forEach((el) => {
           const htmlEl = el as HTMLElement;
           htmlEl.style.boxShadow = htmlEl.dataset.originalBoxShadow || '';
           htmlEl.style.filter = htmlEl.dataset.originalFilter || '';
           // 清理 dataset
           delete htmlEl.dataset.originalBoxShadow;
           delete htmlEl.dataset.originalFilter;
        });
      }
      
      // 从 canvas 导出为 PNG
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      // iOS Safari 需要特殊的下载处理
      if (isIOS) {
        // 在 iOS 上，创建一个新窗口显示图片，用户可以长按保存
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>长按图片保存</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
                  img { max-width: 100%; height: auto; }
                  p { text-align: center; color: #666; font-family: -apple-system, sans-serif; padding: 20px; }
                </style>
              </head>
              <body>
                <div>
                  <p>长按图片保存到相册</p>
                  <img src="${dataUrl}" />
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        // PC 端正常下载
      const link = document.createElement("a");
        link.href = dataUrl;
      link.download = `nova-gen-${activeTab}-${Date.now()}.png`;
      link.click();
      }
    } catch (err) {
      console.error("Screenshot failed", err);
      alert("截图生成失败，请重试");
    }
  };

  const inspirationPrompts = [
    "哈哈哈，真的假的？", "笑死我了，然后呢？", "这也太离谱了吧...", "我不信，除非你V我50", "??? 什么情况", "确实，我也这么觉得"
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* --- Left Panel: Controls --- */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Tabs */}
          <div className="grid grid-cols-3 border-b">
            {[
                { id: 'message', label: '消息对话', icon: MessageSquareText, color: 'green' },
                { id: 'post', label: '社交笔记', icon: ImageIcon, color: 'red' },
                { id: 'forum', label: '论坛帖子', icon: List, color: 'blue' },
            ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Mode)}
                  className={`py-4 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2
                    ${activeTab === tab.id 
                        ? `bg-${tab.color}-50 text-${tab.color}-600 border-b-2 border-${tab.color}-500` 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className="w-4 h-4" /> 
                  {tab.label}
                </button>
            ))}
          </div>

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Common Status Bar Config */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                <Settings className="w-4 h-4" /> 顶部状态栏
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">时间</label>
                  <input type="text" value={globalConfig.time} onChange={(e) => setGlobalConfig({...globalConfig, time: e.target.value})} className={inputFieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">电量 (%)</label>
                  <input type="number" min="1" max="100" value={globalConfig.battery} onChange={(e) => setGlobalConfig({...globalConfig, battery: parseInt(e.target.value) || 100})} className={inputFieldClass} />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* --- SHARED CHAT / SMS CONTROLS --- */}
            {activeTab === 'message' && (
              <>
                {/* Message Sub-Mode Switcher */}
                <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-2 gap-1 mb-2">
                    <button 
                        onClick={() => setMessageMode('wechat')} 
                        className={`py-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-2 ${messageMode === 'wechat' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <MessageSquarePlus className="w-4 h-4" /> 微信模式
                    </button>
                    <button 
                        onClick={() => setMessageMode('sms')} 
                        className={`py-2 rounded-md text-xs font-bold transition flex items-center justify-center gap-2 ${messageMode === 'sms' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> 短信模式
                    </button>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                    <User className="w-4 h-4" /> {messageMode === 'wechat' ? '微信设置' : '短信设置'}
                  </h2>
                  <div className="flex gap-2">
                    <div className="flex-1">
                       <label className="block text-xs font-medium text-gray-700 mb-1">联系人昵称/号码</label>
                       <input type="text" value={chatConfig.nickname} onChange={(e) => setChatConfig({...chatConfig, nickname: e.target.value})} className={inputFieldClass} />
                    </div>
                  </div>
                  
                  {/* 自定义头像上传 */}
                  {messageMode === 'wechat' && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-medium text-gray-700">自定义头像</label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* 我的头像 */}
                        <div 
                          className="relative group border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-green-400 transition cursor-pointer"
                          onClick={() => document.getElementById('myAvatarInput')?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-green-400', 'bg-green-50'); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove('border-green-400', 'bg-green-50'); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-green-400', 'bg-green-50');
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => openCropModal(reader.result as string, 'myAvatar');
                              reader.readAsDataURL(file);
                            }
                          }}
                        >
                          <input 
                            id="myAvatarInput" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => openCropModal(reader.result as string, 'myAvatar');
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                              {chatConfig.myAvatar ? (
                                <img src={chatConfig.myAvatar} className="w-full h-full object-cover" alt="我的头像" />
                              ) : (
                                <Avatar type="me" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700">我的头像</p>
                              <p className="text-[10px] text-gray-400 truncate">点击或拖拽上传</p>
                            </div>
                          </div>
                          {chatConfig.myAvatar && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setChatConfig({...chatConfig, myAvatar: ""}); }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >×</button>
                          )}
                        </div>
                        
                        {/* 对方头像 */}
                        <div 
                          className="relative group border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-blue-400 transition cursor-pointer"
                          onClick={() => document.getElementById('otherAvatarInput')?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50'); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => openCropModal(reader.result as string, 'otherAvatar');
                              reader.readAsDataURL(file);
                            }
                          }}
                        >
                          <input 
                            id="otherAvatarInput" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => openCropModal(reader.result as string, 'otherAvatar');
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                              {chatConfig.otherAvatar ? (
                                <img src={chatConfig.otherAvatar} className="w-full h-full object-cover" alt="对方头像" />
                              ) : (
                                <Avatar type="other" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700">对方头像</p>
                              <p className="text-[10px] text-gray-400 truncate">点击或拖拽上传</p>
                            </div>
                          </div>
                          {chatConfig.otherAvatar && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setChatConfig({...chatConfig, otherAvatar: ""}); }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >×</button>
                          )}
                        </div>
                      </div>
                      
                      {/* 聊天背景 */}
                      <div 
                        className="relative group border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-purple-400 transition cursor-pointer"
                        onClick={() => document.getElementById('bgImageInput')?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-purple-400', 'bg-purple-50'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50'); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onloadend = () => setChatConfig({...chatConfig, bgImage: reader.result as string});
                            reader.readAsDataURL(file);
                          }
                        }}
                      >
                        <input 
                          id="bgImageInput" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setChatConfig({...chatConfig, bgImage: reader.result as string});
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {chatConfig.bgImage ? (
                              <img src={chatConfig.bgImage} className="w-full h-full object-cover" alt="聊天背景" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700">聊天背景</p>
                            <p className="text-[10px] text-gray-400">点击或拖拽上传自定义背景图</p>
                          </div>
                        </div>
                        {chatConfig.bgImage && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setChatConfig({...chatConfig, bgImage: ""}); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >×</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> 消息编辑器
                  </h2>
                  
                  {/* Tool Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                     {[
                       { id: 'text', icon: Type, label: '文字' },
                       { id: 'photo', icon: ImageIcon, label: '照片' },
                       { id: 'voice', icon: Mic, label: '语音消息' },
                       { id: 'call', icon: Phone, label: '通话记录' },
                       { id: 'date', icon: Calendar, label: '添加日期' },
                       { id: 'system', icon: Bell, label: '系统通知' },
                       { id: 'font', icon: Maximize, label: '字体/大小' },
                     ].map((tool) => (
                       <button 
                          key={tool.id}
                          onClick={() => handleToolChange(tool.id as any)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${activeTool === tool.id ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                       >
                         <tool.icon className="w-6 h-6 mb-1" />
                         <span className="text-[10px] font-medium">{tool.label}</span>
                       </button>
                     ))}
                  </div>

                  {/* Input Logic */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
                    {activeTool !== 'font' && (
                        <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-200 p-1 rounded-lg">
                            <button onClick={() => setChatSender('other')} className={`text-xs py-1.5 rounded-md font-bold transition ${chatSender === 'other' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>对方发送</button>
                            <button onClick={() => setChatSender('me')} className={`text-xs py-1.5 rounded-md font-bold transition ${chatSender === 'me' ? 'bg-[#95EC69] shadow text-black' : 'text-gray-500'}`}>我发送</button>
                        </div>
                    )}

                    {activeTool === 'text' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                             <span className="text-xs font-medium text-gray-500">文本内容</span>
                             <button 
                                onClick={() => setInspirationOpen(!inspirationOpen)} 
                                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition ${inspirationOpen ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-white border-gray-200 text-gray-500'}`}
                             >
                                <Lightbulb className="w-3 h-3" /> 灵感
                             </button>
                          </div>
                          {inspirationOpen && (
                             <div className="flex flex-wrap gap-2 mb-2 p-2 bg-yellow-50/50 rounded-lg border border-yellow-100/50">
                                {inspirationPrompts.map((p, i) => (
                                   <button key={i} onClick={() => setChatInput(p)} className="text-[10px] bg-white border border-yellow-200 text-gray-600 px-2 py-1 rounded hover:bg-yellow-100 transition">
                                      {p}
                                   </button>
                                ))}
                             </div>
                          )}
                          <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="输入内容..." className={inputAreaClass} />
                        </div>
                    )}

                    {activeTool === 'photo' && (
                        <div className="space-y-3">
                           {/* 图片上传区域 */}
                           <div 
                             className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition cursor-pointer text-center"
                             onClick={() => document.getElementById('chatPhotoInput')?.click()}
                             onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50'); }}
                             onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50'); }}
                             onDrop={(e) => {
                               e.preventDefault();
                               e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50');
                               const file = e.dataTransfer.files[0];
                               if (file && file.type.startsWith('image/')) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setPhotoImageUrl(reader.result as string);
                                 reader.readAsDataURL(file);
                               }
                             }}
                           >
                             <input 
                               id="chatPhotoInput" 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const reader = new FileReader();
                                   reader.onloadend = () => setPhotoImageUrl(reader.result as string);
                                   reader.readAsDataURL(file);
                                 }
                               }}
                             />
                             {photoImageUrl && photoImageUrl.startsWith('data:image') ? (
                               <div className="relative">
                                 <img src={photoImageUrl} className="max-h-32 mx-auto rounded" alt="预览" />
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     setPhotoImageUrl("");
                                   }}
                                   className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                 >×</button>
                               </div>
                             ) : (
                               <div className="py-4">
                                 <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                 <p className="text-xs text-gray-500">点击或拖拽上传图片</p>
                               </div>
                             )}
                           </div>
                           
                           {/* URL 输入备选 */}
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-400">或输入URL:</span>
                             <input 
                               type="text" 
                               value={photoImageUrl.startsWith('data:image') ? '' : photoImageUrl} 
                               onChange={(e) => setPhotoImageUrl(e.target.value)} 
                               placeholder="https://..." 
                               className={`${inputFieldClass} text-xs flex-1`} 
                             />
                           </div>
                           
                           <div>
                             <div className="flex justify-between text-xs text-gray-500 mb-1">
                               <span>图片显示宽度</span>
                               <span>{imageWidth}%</span>
                             </div>
                             <input 
                               type="range" min="20" max="100" 
                               value={imageWidth} 
                               onChange={(e) => setImageWidth(parseInt(e.target.value))}
                               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                             />
                           </div>
                        </div>
                    )}

                    {activeTool === 'system' && <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="系统消息内容..." className={inputFieldClass} />}
                    
                    {activeTool === 'date' && <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="例如: 昨天 14:00 (留空使用当前)" className={inputFieldClass} />}
                    
                    {activeTool === 'voice' && (
                        <div className="space-y-3">
                          <div>
                             <label className="text-xs font-medium text-gray-500">语音时长 (秒)</label>
                             <input type="number" value={voiceDuration} onChange={(e) => setVoiceDuration(Number(e.target.value))} className={inputFieldClass} />
                          </div>
                          <div>
                             <label className="text-xs font-medium text-gray-500">转文字内容 (可选)</label>
                             <input type="text" value={voiceTranscription} onChange={(e) => setVoiceTranscription(e.target.value)} className={inputFieldClass} />
                          </div>
                        </div>
                    )}
                    
                    {activeTool === 'call' && (
                       <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                             <select value={callType} onChange={(e) => setCallType(e.target.value as any)} className={inputFieldClass}>
                               <option value="voice">语音通话</option>
                               <option value="video">视频通话</option>
                             </select>
                             <select value={callState} onChange={(e) => setCallState(e.target.value as any)} className={inputFieldClass}>
                               <option value="active">已接通</option>
                               <option value="cancelled">已取消</option>
                               <option value="missed">未接听/已拒绝</option>
                             </select>
                          </div>
                          {callState === 'active' && (
                            <div>
                               <label className="block text-xs font-medium text-gray-700 mb-1">通话时长</label>
                               <input 
                                  type="text" 
                                  value={callDuration} 
                                  onChange={(e) => setCallDuration(e.target.value)} 
                                  placeholder="例如 00:05" 
                                  className={inputFieldClass} 
                               />
                            </div>
                          )}
                       </div>
                    )}
                    
                    {activeTool === 'font' && (
                       <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>全局字体大小</span>
                              <span>{chatConfig.fontSize}px</span>
                            </div>
                            <input 
                              type="range" min="12" max="24" step="1"
                              value={chatConfig.fontSize} 
                              onChange={(e) => setChatConfig({...chatConfig, fontSize: parseInt(e.target.value)})}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-2">提示：字体大小也会按比例影响图片和气泡的显示尺寸。</p>
                         </div>
                       </div>
                    )}

                    {activeTool !== 'font' && (
                        <button onClick={addChatMessage} className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold shadow flex items-center justify-center gap-2">
                            <PlusCircle className="w-4 h-4" /> 添加
                        </button>
                    )}
                  </div>

                   <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase">消息列表 (点击删除)</h3>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {messages.map(m => (
                        <div key={m.id} onClick={() => setMessages(messages.filter(msg => msg.id !== m.id))} className="flex justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-red-50 border border-gray-100">
                          <span className="truncate text-xs text-gray-600 w-3/4 flex items-center gap-1">
                             <span className="font-bold bg-gray-200 px-1 rounded text-[10px] uppercase">{(m as any).sender || m.type}</span>
                             {m.type === 'voice' ? `[语音 ${m.meta?.duration}]` : m.type === 'call' ? `[通话 ${m.meta?.callState}]` : m.content}
                          </span>
                          <Trash2 className="w-3 h-3 text-gray-300" />
                        </div>
                      ))}
                    </div>
                 </div>
                </div>
              </>
            )}

            {/* --- FORUM CONTROLS --- */}
            {activeTab === 'forum' && (
                <div className="space-y-5">
                   <div className="space-y-3">
                      <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2"><List className="w-4 h-4" /> 帖子信息</h2>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">版块名称</label>
                        <input type="text" value={forumConfig.boardName} onChange={e => setForumConfig({...forumConfig, boardName: e.target.value})} placeholder="例如: 情感天地" className={inputFieldClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">帖子标题</label>
                        <input type="text" value={forumConfig.title} onChange={e => setForumConfig({...forumConfig, title: e.target.value})} className={`${inputFieldClass} font-bold`} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">楼主正文</label>
                        <textarea value={forumConfig.opContent} onChange={e => setForumConfig({...forumConfig, opContent: e.target.value})} className={`${inputAreaClass} h-24`} />
                      </div>
                      
                      {/* 楼主正文图片（可选） */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">正文图片（可选）</label>
                        <div 
                          className="relative border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-blue-400 transition cursor-pointer"
                          onClick={() => document.getElementById('forumOpImageInput')?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50'); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => setForumConfig({...forumConfig, opImage: reader.result as string});
                              reader.readAsDataURL(file);
                            }
                          }}
                        >
                          <input 
                            id="forumOpImageInput" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setForumConfig({...forumConfig, opImage: reader.result as string});
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {forumConfig.opImage ? (
                            <div className="relative">
                              <img src={forumConfig.opImage} className="max-h-20 mx-auto rounded" alt="预览" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setForumConfig({...forumConfig, opImage: ""}); }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                              >×</button>
                            </div>
                          ) : (
                            <div className="py-2 text-center">
                              <ImageIcon className="w-5 h-5 mx-auto text-gray-300 mb-1" />
                              <p className="text-[10px] text-gray-400">点击或拖拽上传图片</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">楼主昵称</label>
                            <input type="text" value={forumConfig.opNickname} onChange={e => setForumConfig({...forumConfig, opNickname: e.target.value})} className={inputFieldClass} />
                         </div>
                         <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">浏览量</label>
                            <input type="text" value={forumConfig.viewCount} onChange={e => setForumConfig({...forumConfig, viewCount: e.target.value})} className={inputFieldClass} />
                         </div>
                         <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">回复数</label>
                            <input type="text" value={forumConfig.replyCount} onChange={e => setForumConfig({...forumConfig, replyCount: e.target.value})} className={inputFieldClass} />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2"><MessageCircle className="w-4 h-4" /> 回复/盖楼</h2>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                         <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">回复人昵称</label>
                                <input type="text" value={newForumReply.nickname} onChange={e => setNewForumReply({...newForumReply, nickname: e.target.value})} className={inputFieldClass} />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 px-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={newForumReply.isOp} onChange={e => setNewForumReply({...newForumReply, isOp: e.target.checked})} /> 楼主
                                </label>
                            </div>
                         </div>
                         
                         <div className="mb-2">
                             <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-medium text-gray-500">引用回复对象</label>
                                {newForumReply.quoteTargetNickname && (
                                    <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-[10px] border border-blue-100">
                                        <span className="text-blue-600 font-bold">回复: {newForumReply.quoteTargetNickname}</span>
                                        <button onClick={() => setNewForumReply({...newForumReply, quote: "", quoteTargetNickname: ""})} className="text-blue-400 hover:text-red-500">
                                            <X className="w-3 h-3"/>
                                        </button>
                                    </div>
                                )}
                             </div>
                             <select 
                                className={`${inputFieldClass} mb-1`} 
                                value={newForumReply.quoteTargetNickname ? 'custom' : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                        handleForumReplyClick(null);
                                        return;
                                    }
                                    if (val === 'op') {
                                        handleForumReplyClick({ id: 'op', nickname: forumConfig.opNickname, content: forumConfig.opContent });
                                    } else {
                                        const r = forumReplies.find(reply => reply.id === val);
                                        if (r) handleForumReplyClick(r);
                                    }
                                }}
                             >
                                <option value="">-- 选择或点击右侧预览回复 --</option>
                                <option value="op">楼主 ({forumConfig.opNickname})</option>
                                {forumReplies.map(r => (
                                    <option key={r.id} value={r.id}>{r.floor}楼 ({r.nickname})</option>
                                ))}
                                {newForumReply.quoteTargetNickname && <option value="custom" disabled>当前选中: {newForumReply.quoteTargetNickname}</option>}
                             </select>
                             <input type="text" value={newForumReply.quote} onChange={e => setNewForumReply({...newForumReply, quote: e.target.value})} placeholder="引用内容 (可为空)" className={`${inputFieldClass} text-xs text-gray-500`} />
                             <p className="text-[10px] text-gray-400 mt-1">* 提示：若手动输入引用内容且未指定对象，预览中将默认显示回复“楼主”。</p>
                         </div>

                         <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">回复内容</label>
                            <textarea value={newForumReply.content} onChange={e => setNewForumReply({...newForumReply, content: e.target.value})} className={inputAreaClass} />
                         </div>
                         <button onClick={addForumReply} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">添加回复</button>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto">
                         {forumReplies.map(r => (
                            <div key={r.id} className="flex justify-between items-center bg-white p-2 border rounded text-xs">
                               <div className="flex items-center gap-2 overflow-hidden">
                                   <span className="font-bold text-gray-500 w-8 flex-shrink-0">{r.floor}L</span>
                                   <div className="flex flex-col truncate">
                                       <span className="font-bold text-gray-700">{r.nickname}</span>
                                       <span className="text-gray-500 truncate">{r.content}</span>
                                   </div>
                               </div>
                               <div className="flex items-center gap-1 flex-shrink-0">
                                   <button onClick={() => handleForumReplyClick(r)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><MessageSquare className="w-3.5 h-3.5" /></button>
                                   <button onClick={() => setForumReplies(forumReplies.filter(x => x.id !== r.id))} className="text-gray-300 hover:text-red-500 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
            )}

            {/* --- POST CONTROLS --- */}
            {activeTab === 'post' && (
               <div className="space-y-5">
                 <div className="space-y-3">
                    <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2"><User className="w-4 h-4" /> 作者 & 统计</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">作者昵称</label>
                          <input type="text" value={postConfig.authorName} onChange={e => setPostConfig({...postConfig, authorName: e.target.value})} className={inputFieldClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">发布信息</label>
                          <input type="text" value={postConfig.dateLocation} onChange={e => setPostConfig({...postConfig, dateLocation: e.target.value})} className={inputFieldClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">点赞数</label>
                          <input type="text" value={postConfig.likeCount} onChange={e => setPostConfig({...postConfig, likeCount: e.target.value})} className={inputFieldClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">收藏数</label>
                          <input type="text" value={postConfig.collectCount} onChange={e => setPostConfig({...postConfig, collectCount: e.target.value})} className={inputFieldClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">评论数</label>
                          <input type="text" value={postConfig.commentCount} onChange={e => setPostConfig({...postConfig, commentCount: e.target.value})} className={inputFieldClass} />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> 帖子内容</h2>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">标题</label>
                        <input type="text" value={postConfig.title} onChange={e => setPostConfig({...postConfig, title: e.target.value})} className={`${inputFieldClass} font-bold`} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">正文</label>
                        <textarea value={postConfig.content} onChange={e => setPostConfig({...postConfig, content: e.target.value})} className={`${inputAreaClass} h-24`} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">标签 (空格分隔)</label>
                        <input type="text" value={postConfig.tags} onChange={e => setPostConfig({...postConfig, tags: e.target.value})} className={`${inputFieldClass} text-blue-500`} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">帖子图片</label>
                        {/* 图片上传区域 */}
                        <div 
                          className="relative border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-red-400 transition cursor-pointer"
                          onClick={() => document.getElementById('postImageInput')?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-red-400', 'bg-red-50'); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove('border-red-400', 'bg-red-50'); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => setPostConfig({...postConfig, imageUrl: reader.result as string});
                              reader.readAsDataURL(file);
                            }
                          }}
                        >
                          <input 
                            id="postImageInput" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setPostConfig({...postConfig, imageUrl: reader.result as string});
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {postConfig.imageUrl ? (
                            <div className="relative">
                              <img src={postConfig.imageUrl} className="max-h-24 mx-auto rounded" alt="预览" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPostConfig({...postConfig, imageUrl: ""}); }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                              >×</button>
                            </div>
                          ) : (
                            <div className="py-2 text-center">
                              <ImageIcon className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                              <p className="text-[10px] text-gray-400">点击或拖拽上传图片</p>
                            </div>
                          )}
                        </div>
                        {/* URL 输入备选 */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-gray-400 flex-shrink-0">或URL:</span>
                          <input 
                            type="text" 
                            value={postConfig.imageUrl.startsWith('data:image') ? '' : postConfig.imageUrl} 
                            onChange={e => setPostConfig({...postConfig, imageUrl: e.target.value})} 
                            placeholder="https://..." 
                            className={`${inputFieldClass} text-xs flex-1`} 
                          />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h2 className="text-xs uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2"><MessageCircle className="w-4 h-4" /> 评论区</h2>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {replyingToId && (
                           <div className="flex justify-between items-center mb-2 bg-blue-50 px-2 py-1 rounded">
                              <span className="text-xs text-blue-600">正在回复: {replyTargetName || '评论'}</span>
                              <button onClick={() => { setReplyingToId(null); setReplyTargetName(""); }} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                           </div>
                        )}
                        <input type="text" value={newComment.nickname} onChange={e => setNewComment({...newComment, nickname: e.target.value})} placeholder="评论人昵称" className={`${inputFieldClass} mb-2`} />
                        <div className="flex gap-2 mb-2">
                             <input type="text" value={newComment.content} onChange={e => setNewComment({...newComment, content: e.target.value})} placeholder="评论内容..." className={`${inputFieldClass} flex-1`} />
                             <div className="relative w-20">
                                <Heart className="w-3 h-3 absolute top-3 left-2 text-gray-400" />
                                <input type="number" value={newComment.likes} onChange={e => setNewComment({...newComment, likes: Number(e.target.value)})} placeholder="赞" className={`${inputFieldClass} pl-6`} />
                             </div>
                        </div>
                        <button onClick={addComment} className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-bold">
                           {replyingToId ? '回复评论' : '添加评论'}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                       {comments.map(c => (
                          <div key={c.id} className="text-xs space-y-1 bg-white p-2 border rounded">
                             <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="font-bold text-gray-700">{c.nickname}</span>
                                    <span className="text-gray-600 mx-1">: {c.content}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Heart className="w-3 h-3 text-red-500 fill-red-500" /> 
                                        <span className="text-gray-400">{c.likes}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setReplyingToId(c.id); setReplyTargetName(c.nickname); }} className="text-blue-500 p-1 bg-blue-50 rounded"><MessageCircle className="w-3 h-3" /></button>
                                    <button onClick={() => setComments(comments.filter(x => x.id !== c.id))} className="text-red-500 p-1 bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                                </div>
                             </div>
                             
                             {c.replies.length > 0 && (
                                <div className="pl-2 ml-1 border-l-2 border-gray-100 mt-2 space-y-2">
                                   {c.replies.map(r => (
                                      <div key={r.id} className="flex justify-between items-start bg-gray-50 p-1.5 rounded">
                                         <div className="flex-1">
                                             <span className="font-bold text-gray-600">{r.nickname}</span>
                                             {r.targetName && <span className="text-gray-400 mx-1">回复 {r.targetName}</span>}
                                             <span className="text-gray-500">: {r.content}</span>
                                         </div>
                                         <div className="flex items-center gap-1 ml-2">
                                             <button onClick={() => { setReplyingToId(c.id); setReplyTargetName(r.nickname); }} className="text-blue-400 hover:text-blue-600"><MessageCircle className="w-3 h-3" /></button>
                                             <button onClick={() => {
                                                  const updatedReplies = c.replies.filter(rep => rep.id !== r.id);
                                                  setComments(comments.map(x => x.id === c.id ? {...x, replies: updatedReplies} : x));
                                             }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
            )}

          </div>
          
          <div className="p-4 border-t bg-gray-50">
              <button onClick={handleDownload} className="w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg shadow-md transition flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> 生成截图
              </button>
          </div>
        </div>

        {/* --- Right Panel: Preview --- */}
        <div className="flex justify-center items-start lg:sticky lg:top-8 select-none">
          <div 
            id="phone-casing" 
            className="relative bg-black rounded-[55px] shadow-2xl p-[14px] border-[4px] border-[#333] box-content"
            style={{ width: 375, height: 812 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[30px] w-[160px] bg-black rounded-b-[20px] z-50 pointer-events-none"></div>
            
            <div 
              id="phone-screen" 
              ref={previewRef}
              className={`w-full h-full rounded-[40px] overflow-hidden flex flex-col relative ${getScreenBgClass()}`}
            >
              
              {/* Status Bar */}
              <div className={`h-[44px] flex justify-between items-end px-6 pb-1 z-40 relative ${getStatusBarClass()}`}>
                <span className="font-semibold text-[15px] leading-none ml-2 tracking-wide">{globalConfig.time}</span>
                <div className="flex items-center gap-[5px]">
                  <Signal className="w-[18px] h-[18px] fill-current" strokeWidth={0} />
                  <Wifi className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  <BatteryIcon level={globalConfig.battery} />
                </div>
              </div>

              {/* === MODE: MESSAGE (WeChat / SMS) === */}
              {activeTab === 'message' && messageMode === 'wechat' && (
                <>
                  <div className="h-[44px] bg-[#EDEDED] flex justify-between items-center px-3 z-40 border-b border-[#E0E0E0]">
                    <div className="flex items-center w-1/4">
                      <ChevronLeft className="w-7 h-7 -ml-2 text-[#191919]" strokeWidth={2} />
                      <span className="text-[16px] text-[#191919] -ml-1">微信</span>
                    </div>
                    <div className="flex-1 text-center font-semibold text-[17px] text-[#191919] truncate px-2">{chatConfig.nickname}</div>
                    <div className="flex items-center justify-end w-1/4"><MoreHorizontal className="w-6 h-6 text-[#191919]" /></div>
                  </div>
                  {/* Chat Body */}
                  <div 
                    ref={chatContainerRef} 
                    className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4 bg-[#EDEDED]"
                    style={chatConfig.bgImage ? { 
                      backgroundImage: `url(${chatConfig.bgImage})`, 
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center' 
                    } : undefined}
                  >
                     {messages.map((msg) => {
                        const isMe = msg.type === 'me' || msg.sender === 'me';
                        const bubbleStyle = { fontSize: `${chatConfig.fontSize}px` };

                        if (msg.type === 'time' || msg.type === 'system') return <div key={msg.id} className="flex justify-center my-4"><span className="bg-[#DADADA] text-white text-xs px-2 py-1 rounded-[4px] bg-opacity-60">{msg.content}</span></div>;
                        
                        // 渲染自定义头像或默认头像
                        const renderAvatar = (type: 'me' | 'other') => {
                          const customAvatar = type === 'me' ? chatConfig.myAvatar : chatConfig.otherAvatar;
                          return (
                            <div className="w-[40px] h-[40px] rounded-[6px] overflow-hidden">
                              {customAvatar ? (
                                <img src={customAvatar} className="w-full h-full object-cover" alt={type === 'me' ? '我的头像' : '对方头像'} />
                              ) : (
                                <Avatar type={type} />
                              )}
                            </div>
                          );
                        };
                        
                        // Voice Message
                        if (msg.type === 'voice') {
                            const durationVal = parseInt(msg.meta?.duration || '10');
                            const bubbleWidth = Math.min(200, 70 + (durationVal * 5));
                            
                            return (
                                <div key={msg.id} className={`flex items-start gap-2.5 mb-1 ${isMe ? 'justify-end' : ''}`}>
                                    {!isMe && renderAvatar('other')}
                                    
                                    <div className="flex flex-col gap-1 max-w-[70%]">
                                        <div 
                                            className={`p-2.5 px-3 rounded-[6px] flex items-center gap-2 shadow-sm relative ${isMe ? 'bg-[#95EC69] flex-row-reverse' : 'bg-white'}`}
                                            style={{ width: `${bubbleWidth}px`, ...bubbleStyle }}
                                        >
                                            {isMe && <div className="absolute top-[14px] -right-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-[#95EC69] border-b-[6px] border-b-transparent"></div>}
                                            {!isMe && <div className="absolute top-[14px] -left-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent"></div>}
                                            
                                            <VoiceWave isMe={isMe} />
                                            <span className="text-[#191919] text-[15px]">{msg.meta?.duration}</span>
                                        </div>
                                        {msg.meta?.transcription && (
                                            <div className="bg-white/80 backdrop-blur-sm p-2 rounded text-xs text-gray-600 self-start shadow-sm" style={bubbleStyle}>
                                                {msg.meta.transcription}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isMe && renderAvatar('me')}
                                </div>
                            )
                        }

                        // Call Message
                        if (msg.type === 'call') {
                            return (
                                <div key={msg.id} className={`flex items-start gap-2.5 mb-1 ${isMe ? 'justify-end' : ''}`}>
                                    {!isMe && renderAvatar('other')}
                                    <div className={`max-w-[70%] rounded-[6px] shadow-sm relative ${isMe ? 'bg-[#95EC69]' : 'bg-white'}`}>
                                        {isMe && <div className="absolute top-[14px] -right-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-[#95EC69] border-b-[6px] border-b-transparent"></div>}
                                        {!isMe && <div className="absolute top-[14px] -left-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent"></div>}
                                        
                                        <div className="flex items-center gap-3 p-3 min-w-[160px]">
                                              <div className={`p-2 rounded-full ${isMe ? 'bg-white/20' : 'bg-orange-100'}`}>
                                                {msg.meta?.callType === 'video' ? (
                                                    <Video className={`w-6 h-6 ${isMe ? 'text-black' : 'text-orange-500'}`} />
                                                ) : (
                                                    <Phone className={`w-6 h-6 ${isMe ? 'text-black' : 'text-orange-500'}`} />
                                                )}
                                              </div>
                                              <div>
                                                  <div className="text-[15px] font-medium leading-tight" style={bubbleStyle}>
                                                    {msg.meta?.callState === 'cancelled' ? '已取消' : msg.meta?.callState === 'missed' ? '已拒绝' : `通话时长 ${msg.meta?.duration || '00:05'}`}
                                                  </div>
                                                  <div className="text-[10px] opacity-60">
                                                    {msg.meta?.callType === 'video' ? '视频通话' : '语音通话'}
                                                  </div>
                                              </div>
                                          </div>
                                    </div>
                                    {isMe && renderAvatar('me')}
                                </div>
                            )
                        }

                        // Text/Image Message
                        const imageWidthPercent = msg.type === 'image' ? (msg.meta?.width || 100) : 100;
                        return (
                           <div key={msg.id} className={`flex items-start gap-2.5 mb-1 ${isMe ? 'justify-end' : ''}`}>
                              {!isMe && renderAvatar('other')}
                              <div className={`${msg.type === 'image' ? 'w-fit' : 'max-w-[70%]'} p-2.5 px-3 rounded-[6px] text-black leading-relaxed break-words shadow-sm relative 
                                 ${isMe ? 'bg-[#95EC69]' : 'bg-white'}`} style={{
                                 ...bubbleStyle,
                                 ...(msg.type === 'image' ? { maxWidth: `calc(70% * ${imageWidthPercent / 100})` } : {})
                               }}>
                                 {isMe && <div className="absolute top-[14px] -right-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-[#95EC69] border-b-[6px] border-b-transparent"></div>}
                                 {!isMe && <div className="absolute top-[14px] -left-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent"></div>}
                                 
                                 {msg.type === 'image' ? (
                                     <div style={{ width: '100%', maxWidth: '100%' }}>
                                        <img src={msg.content} className="w-full h-auto block rounded-[4px]" alt="chat" crossOrigin="anonymous" />
                                     </div>
                                 ) : msg.content}
                              </div>
                              {isMe && renderAvatar('me')}
                           </div>
                        )
                     })}
                     <Watermark />
                  </div>
                  <div className="bg-[#F7F7F7] border-t border-[#DCDCDC] p-[10px] px-3 flex items-center gap-3 pb-8">
                     <Mic className="w-[28px] h-[28px] text-[#191919]" strokeWidth={1.5} />
                     <div className="flex-1 bg-white rounded-[6px] h-[40px] border border-[#E5E5E5]" />
                     <Smile className="w-[28px] h-[28px] text-[#191919]" strokeWidth={1.5} />
                     <PlusCircle className="w-[28px] h-[28px] text-[#191919]" strokeWidth={1.5} />
                  </div>
                </>
              )}

              {/* === MODE: MESSAGE (SMS/iMessage) === */}
              {activeTab === 'message' && messageMode === 'sms' && (
                <>
                  <div className="h-[44px] bg-white/90 backdrop-blur flex items-center px-3 z-40 relative">
                     <div className="flex items-center w-1/4 text-blue-500">
                        <ChevronLeft className="w-7 h-7 -ml-2" strokeWidth={2.5} />
                     </div>
                     <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mb-1">
                            <User className="w-full h-full p-1 text-white bg-gray-400" />
                        </div>
                        <span className="text-[11px] text-gray-800">{chatConfig.nickname} &gt;</span>
                     </div>
                     <div className="flex items-center justify-end w-1/4"><Info className="w-6 h-6 text-blue-500" /></div>
                  </div>
                  
                  {/* SMS Body */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2 bg-white">
                     <div className="text-center text-[10px] text-gray-400 font-medium mb-4">
                        iMessage 信息
                     </div>
                     {messages.map((msg) => {
                        const isMe = msg.type === 'me' || msg.sender === 'me';
                        if (msg.type === 'time') return <div key={msg.id} className="text-center text-[10px] text-gray-400 font-bold my-2">{msg.content}</div>;
                        if (msg.type === 'system') return null;
                        return (
                           <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[75%] px-4 py-2 rounded-[18px] text-[16px] leading-snug break-words
                                 ${isMe ? 'bg-[#007AFF] text-white rounded-br-sm' : 'bg-[#E9E9EB] text-black rounded-bl-sm'}`}>
                                 {msg.type === 'image' ? '[图片]' : msg.content}
                                 {msg.type === 'voice' && `[语音 ${msg.meta?.duration}]` }
                                 {msg.type === 'call' && `[通话 ${msg.meta?.callState === 'active' ? msg.meta?.duration : '已取消'}]`}
                              </div>
                              {isMe && <span className="text-[10px] text-gray-400 font-medium mr-1 mt-0.5">已读</span>}
                           </div>
                        )
                     })}
                     <Watermark />
                  </div>

                  <div className="bg-white p-3 pb-8 flex items-center gap-3">
                     <Camera className="w-7 h-7 text-gray-400" />
                     <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-500">A</span>
                     </div>
                     <div className="flex-1 bg-white border border-gray-300 rounded-full h-[36px] flex items-center px-3">
                        <span className="text-sm text-gray-400">iMessage 信息</span>
                     </div>
                     <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5 text-white rotate-90" strokeWidth={3} />
                     </div>
                  </div>
                </>
              )}

              {/* === MODE: FORUM (BBS/Tieba) === */}
              {activeTab === 'forum' && (
                <div className="flex flex-col h-full bg-[#F2F2F2]">
                   {/* Forum Header */}
                   <div className="h-[44px] bg-[#F9F9F9] flex items-center px-4 border-b border-gray-300 z-40">
                      <ChevronLeft className="w-6 h-6 text-gray-600 -ml-2" />
                      <span className="font-bold text-[17px] text-[#333] ml-2">{forumConfig.boardName}</span>
                      <div className="ml-auto"><MoreHorizontal className="w-6 h-6 text-gray-600" /></div>
                   </div>

                   {/* Forum Content */}
                   <div className="flex-1 overflow-y-auto no-scrollbar">
                      {/* OP Floor (Floor 1) */}
                      <div className="bg-white p-4 mb-2">
                         <h1 className="text-[19px] font-bold text-[#333] leading-tight mb-3">{forumConfig.title}</h1>
                         <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded bg-gray-200 overflow-hidden"><Avatar type="author" /></div>
                            <div className="flex flex-col">
                               <div className="flex items-center gap-1">
                                  <span className="text-[13px] font-bold text-[#2D64B3]">{forumConfig.opNickname}</span>
                                  <span className="bg-yellow-400 text-white text-[9px] px-1 rounded-[2px] font-bold">楼主</span>
                               </div>
                               <span className="text-[11px] text-gray-400 flex items-center gap-2">
                                   <span>1楼 · 刚刚</span>
                                   {forumConfig.viewCount && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3"/> {forumConfig.viewCount}</span>}
                               </span>
                            </div>
                         </div>
                         <div className="text-[16px] text-[#333] leading-7 min-h-[80px] whitespace-pre-wrap">{forumConfig.opContent}</div>
                         {forumConfig.opImage && (
                           <div className="mt-3">
                             <img src={forumConfig.opImage} className="max-w-full rounded-lg" alt="帖子图片" />
                           </div>
                         )}
                         <div className="flex justify-end gap-6 mt-4 opacity-60">
                            <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" onClick={() => handleForumReplyClick({id: 'op', nickname: forumConfig.opNickname, content: forumConfig.opContent})}><MessageSquare className="w-4 h-4" /> 回复</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500"><ThumbsUp className="w-4 h-4" /> 赞</div>
                         </div>
                      </div>

                      {/* Replies */}
                      {forumReplies.map((reply) => (
                         <div key={reply.id} className="bg-white p-3 border-b border-gray-100 mb-0.5">
                            <div className="flex gap-3">
                               <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0 mt-1">
                                  <Avatar type="random" seed={reply.floor} />
                               </div>
                               <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                     <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] text-[#2D64B3]">{reply.nickname}</span>
                                        {reply.isOp && <span className="bg-yellow-400 text-white text-[9px] px-1 rounded-[2px] font-bold">楼主</span>}
                                        <span className="text-[10px] text-gray-300 ml-1">LV.{reply.floor + 2}</span>
                                     </div>
                                     <span className="text-[11px] text-gray-400">{reply.floor}楼</span>
                                  </div>
                                  
                                  {reply.quote && (
                                     <div className="bg-[#F7F7F7] p-2 mb-2 text-[13px] text-gray-500 rounded border border-gray-200">
                                        回复 {reply.quoteTargetNickname || forumReplies.find(r => r.content === reply.quote)?.nickname || '楼主'}：{reply.quote}
                                     </div>
                                  )}

                                  <div className="text-[15px] text-[#333] leading-6 mb-2">{reply.content}</div>
                                  
                                  <div className="flex justify-between items-center mt-2">
                                     <span className="text-[11px] text-gray-400">{reply.time}</span>
                                     <div className="flex gap-4">
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1 cursor-pointer hover:text-blue-500" onClick={() => handleForumReplyClick(reply)}>
                                            <MessageSquare className="w-3 h-3" /> 回复
                                        </span>
                                        <span className="text-[11px] text-gray-400 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {reply.likes || '赞'}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))}
                      
                      <div className="p-4 text-center text-xs text-gray-400">已加载全部回复</div>
                      <Watermark />
                   </div>

                   {/* Forum Bottom Bar */}
                   <div className="h-[50px] bg-white border-t flex items-center px-4 gap-3">
                      <div className="flex-1 bg-[#F2F2F2] h-[32px] rounded-full flex items-center px-3 text-xs text-gray-400">
                         我来说两句...
                      </div>
                      <MessageSquare className="w-6 h-6 text-gray-500" />
                      <Share2 className="w-6 h-6 text-gray-500" />
                   </div>
                </div>
              )}

              {/* === MODE: POST (Little Red Book) === */}
              {activeTab === 'post' && (
                <div className="flex flex-col h-full bg-white relative">
                   {/* Nav Bar */}
                   <div className="h-[44px] flex items-center justify-between px-3 z-40 bg-white/90 backdrop-blur">
                      <ChevronLeft className="w-7 h-7 text-gray-800 -ml-2" />
                      <div className="flex items-center gap-2">
                         <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100">
                             <Avatar type="author" />
                         </div>
                         <span className="text-sm font-semibold text-gray-700">{postConfig.authorName}</span>
                         <button className="text-xs text-red-500 font-bold border border-red-500 px-2 py-0.5 rounded-full">关注</button>
                      </div>
                      <Share2 className="w-5 h-5 text-gray-700" />
                   </div>

                   {/* Content */}
                   <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                      {/* Image Carousel Mock */}
                      <div className="w-full aspect-[3/4] bg-gray-100 relative mb-3 overflow-hidden">
                          {postConfig.imageUrl ? (
                             <img src={postConfig.imageUrl} className="w-full h-full object-cover" alt="Post" crossOrigin="anonymous" />
                          ) : (
                             <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50 flex-col gap-2">
                                <ImageIcon className="w-12 h-12 opacity-20" />
                                <span className="text-xs text-gray-400">3:4 Image</span>
                             </div>
                          )}
                          {/* Dots */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-white shadow"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-white/50 shadow"></div>
                             <div className="w-1.5 h-1.5 rounded-full bg-white/50 shadow"></div>
                          </div>
                      </div>

                      <div className="px-4">
                         <h1 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{postConfig.title}</h1>
                         <p className="text-[15px] text-gray-800 leading-relaxed mb-2 whitespace-pre-wrap">{postConfig.content}</p>
                         <p className="text-[15px] text-blue-600 mb-3 font-medium">
                            {postConfig.tags}
                         </p>
                         <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
                             <span>{postConfig.dateLocation}</span>
                         </div>
                         
                         {/* Comments Section */}
                         <div className="space-y-4">
                            <div className="text-sm font-bold text-gray-700">共 {postConfig.commentCount} 条评论</div>
                            
                            {comments.map((comment) => (
                               <div key={comment.id} className="flex gap-3 items-start">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                      <Avatar type="random" seed={comment.avatarSeed} />
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex flex-col">
                                         <span className="text-[13px] text-gray-500 font-medium mb-0.5">{comment.nickname}</span>
                                         <span className="text-[14px] text-gray-800 leading-snug mb-1" onClick={() => {setReplyingToId(comment.id); setReplyTargetName(comment.nickname)}}>{comment.content}</span>
                                         <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-2">
                                            <span>昨天</span>
                                            <span className="font-medium cursor-pointer" onClick={() => {setReplyingToId(comment.id); setReplyTargetName(comment.nickname)}}>回复</span>
                                         </div>
                                      </div>
                                      
                                      {/* Nested Replies */}
                                      {comment.replies.length > 0 && (
                                          <div className="space-y-2 mt-1">
                                              {comment.replies.map(reply => (
                                                  <div key={reply.id} className="flex items-start justify-between">
                                                      <div className="leading-snug text-[13px] pr-2">
                                                          <span className="font-bold text-gray-600">{reply.nickname}</span>
                                                          {reply.targetName && <span className="text-gray-400 mx-1">回复 <span className="text-gray-600">{reply.targetName}</span></span>}
                                                          <span className="text-gray-800 mx-1">: {reply.content}</span>
                                                          <span className="text-gray-400 ml-2 text-[10px] cursor-pointer" onClick={(e) => {
                                                              e.stopPropagation();
                                                              setReplyingToId(comment.id); 
                                                              setReplyTargetName(reply.nickname);
                                                          }}>回复</span>
                                                      </div>
                                                      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                                         <Heart className="w-3 h-3 text-gray-400" />
                                                         <span className="text-[9px] text-gray-400">{reply.likes}</span>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                                  <div className="flex flex-col items-center gap-1 pt-1">
                                      <Heart className="w-4 h-4 text-gray-400" />
                                      <span className="text-[10px] text-gray-400">{comment.likes}</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                         <Watermark />
                      </div>
                   </div>

                   {/* Footer */}
                   <div className="h-[60px] bg-white border-t flex items-center px-4 gap-4 pb-4">
                      <div className="flex-1 bg-gray-100 h-[36px] rounded-full flex items-center px-4 text-sm text-gray-400">
                         说点什么...
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                          <Heart className="w-6 h-6" />
                          <span className="text-xs font-medium">{postConfig.likeCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                          <Star className="w-6 h-6" />
                          <span className="text-xs font-medium">{postConfig.collectCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                          <MessageCircle className="w-6 h-6" />
                          <span className="text-xs font-medium">{postConfig.commentCount}</span>
                      </div>
                   </div>
                </div>
              )}

              {/* iOS Home Indicator */}
              <div className={`h-[20px] w-full flex justify-center items-start pt-2 z-50 absolute bottom-1 
                 ${activeTab === 'message' && messageMode === 'wechat' ? 'bg-[#F7F7F7]' : 'bg-transparent pointer-events-none'}`}>
                 <div className="w-[130px] h-[5px] bg-black rounded-full opacity-30"></div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* 头像裁剪弹窗 */}
      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">选择头像展示区域</h3>
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* 裁剪区域 */}
                <div className="flex-1">
                  {cropImageSrc && (
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      minWidth={50}
                      minHeight={50}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={cropImageSrc}
                        style={{ maxWidth: '100%', maxHeight: '400px', display: 'block' }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  )}
                </div>
                
                {/* 预览区域 */}
                {completedCrop && imgRef.current && (
                  <div className="md:w-32 flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 font-medium">预览</p>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          objectFit: 'contain',
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeCropModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={!completedCrop}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);