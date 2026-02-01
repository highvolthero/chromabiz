import React, { useEffect, useState, useRef } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster, toast } from 'sonner';
import { AppProvider, useAppContext } from './context/AppContext';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Skeleton } from './components/ui/skeleton';
import { ScrollArea } from './components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { 
  MessageCircle, 
  Palette, 
  Star,
  Trash2,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  Download,
  Code,
  FileJson,
  ImageIcon,
  Send,
  Clock,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BUSINESS_CATEGORIES = [
  'Food & Beverage', 'Technology', 'Healthcare', 'Fashion & Beauty',
  'Education', 'Finance', 'Entertainment', 'Real Estate',
  'Fitness & Wellness', 'Professional Services', 'Retail', 'Other'
];

const AGE_GROUPS = ['13-18', '19-25', '26-35', '36-45', '46-55', '56-65', '65+'];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'South Korea',
  'Singapore', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Switzerland',
  'United Arab Emirates', 'Other'
];

// Helper functions
const getContrastColor = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Input Form Component
function InputForm({ onSuccess }) {
  const { 
    setPalettes, setBusinessInfo, isGenerating, setIsGenerating,
    setRateLimits, palettes
  } = useAppContext();

  const [formData, setFormData] = useState({
    business_name: '', business_category: '', target_country: '',
    age_groups: [], target_gender: 'All Genders', brand_values: '', competitors: ''
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
    if (!formData.business_category) newErrors.business_category = 'Please select a category';
    if (!formData.target_country) newErrors.target_country = 'Please select a country';
    if (formData.age_groups.length === 0) newErrors.age_groups = 'Please select at least one age group';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleAgeGroup = (age) => {
    setFormData(prev => ({
      ...prev,
      age_groups: prev.age_groups.includes(age)
        ? prev.age_groups.filter(a => a !== age)
        : [...prev.age_groups, age]
    }));
    if (errors.age_groups) setErrors(prev => ({ ...prev, age_groups: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await axios.post(`${API}/generate-palettes`, formData);
      setPalettes(response.data.palettes);
      setBusinessInfo(formData);
      setRateLimits(prev => ({ ...prev, generations_remaining: response.data.remaining_generations }));
      toast.success('Palettes generated successfully!');
      setIsCollapsed(true);
      onSuccess?.();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Daily limit reached. Please try again tomorrow.');
      } else {
        toast.error('Failed to generate palettes. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (palettes.length > 0) setIsCollapsed(true);
  }, [palettes]);

  return (
    <div className="mb-8" data-testid="input-form-container">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-xl mb-4 hover:bg-secondary transition-colors"
        data-testid="form-collapse-toggle"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-heading font-bold text-lg">
            {palettes.length > 0 ? 'Edit Business Details' : 'Enter Business Details'}
          </span>
        </div>
        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="animate-fade-in" data-testid="palette-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Business Name *
              </Label>
              <Input
                id="business_name"
                data-testid="business-name-input"
                placeholder="e.g., Sunrise Coffee Co."
                value={formData.business_name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, business_name: e.target.value }));
                  if (errors.business_name) setErrors(prev => ({ ...prev, business_name: undefined }));
                }}
                className={errors.business_name ? 'border-destructive' : ''}
              />
              {errors.business_name && <p className="text-sm text-destructive">{errors.business_name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Business Category *
              </Label>
              <Select
                value={formData.business_category}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, business_category: value }));
                  if (errors.business_category) setErrors(prev => ({ ...prev, business_category: undefined }));
                }}
              >
                <SelectTrigger data-testid="category-select" className={errors.business_category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_category && <p className="text-sm text-destructive">{errors.business_category}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Target Country *
              </Label>
              <Select
                value={formData.target_country}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, target_country: value }));
                  if (errors.target_country) setErrors(prev => ({ ...prev, target_country: undefined }));
                }}
              >
                <SelectTrigger data-testid="country-select" className={errors.target_country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.target_country && <p className="text-sm text-destructive">{errors.target_country}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Target Gender
              </Label>
              <Select
                value={formData.target_gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, target_gender: value }))}
              >
                <SelectTrigger data-testid="gender-select">
                  <SelectValue placeholder="Select target gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Genders">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary inclusive">Non-binary inclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Target Age Groups *
              </Label>
              <div className="flex flex-wrap gap-2" data-testid="age-groups-container">
                {AGE_GROUPS.map((age) => (
                  <Badge
                    key={age}
                    variant={formData.age_groups.includes(age) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      formData.age_groups.includes(age) 
                        ? 'bg-foreground text-background' 
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => toggleAgeGroup(age)}
                    data-testid={`age-group-${age}`}
                  >
                    {age}
                    {formData.age_groups.includes(age) && <X className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
              {errors.age_groups && <p className="text-sm text-destructive">{errors.age_groups}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="brand_values" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Brand Values / Keywords (Optional)
              </Label>
              <Textarea
                id="brand_values"
                data-testid="brand-values-input"
                placeholder="e.g., eco-friendly, luxury, playful, innovative..."
                value={formData.brand_values}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_values: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="competitors" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Industry Competitors (Optional)
              </Label>
              <Input
                id="competitors"
                data-testid="competitors-input"
                placeholder="e.g., Starbucks, Blue Bottle Coffee..."
                value={formData.competitors}
                onChange={(e) => setFormData(prev => ({ ...prev, competitors: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="w-full md:w-auto px-12 font-heading font-bold text-lg transition-all hover:-translate-y-0.5"
              data-testid="generate-button"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Generate Palettes</>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Color Swatch Component
function ColorSwatch({ color, colorIndex }) {
  const [copied, setCopied] = useState(false);
  const textColor = getContrastColor(color.hex);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      toast.success(`Copied ${color.hex}`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex-1 h-32 relative group cursor-pointer transition-all duration-300 hover:flex-[1.5] first:rounded-l-lg last:rounded-r-lg overflow-hidden"
      style={{ backgroundColor: color.hex }}
      aria-label={`Color ${color.hex}`}
      data-testid={`color-swatch-${colorIndex}`}
    >
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ color: textColor }}
      >
        {copied ? <Check className="w-5 h-5 mb-1" /> : <Copy className="w-5 h-5 mb-1" />}
        <span className="font-mono text-xs font-bold">{color.hex}</span>
        <span className="text-xs mt-1 px-2 text-center truncate max-w-full">{color.name}</span>
      </div>
    </button>
  );
}

// Palette Card Component
function PaletteCard({ palette, index }) {
  const { favorites, toggleFavorite } = useAppContext();
  const isFavorite = favorites.includes(palette.id);

  const handleExportCSS = () => {
    const cssVars = palette.colors.map((c) => `  --color-${c.usage.toLowerCase().replace(/\s+/g, '-')}: ${c.hex};`).join('\n');
    navigator.clipboard.writeText(`:root {\n${cssVars}\n}`);
    toast.success('CSS variables copied to clipboard!');
  };

  const handleExportJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(palette, null, 2));
    toast.success('JSON copied to clipboard!');
  };

  const handleDownloadPNG = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const colorWidth = 200;
    const height = 300;
    canvas.width = colorWidth * palette.colors.length;
    canvas.height = height;

    palette.colors.forEach((color, i) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(i * colorWidth, 0, colorWidth, height - 50);
      ctx.fillStyle = getContrastColor(color.hex);
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(color.hex, i * colorWidth + colorWidth / 2, height - 80);
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, height - 50, canvas.width, 50);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(palette.name, 20, height - 18);

    const link = document.createElement('a');
    link.download = `${palette.name.toLowerCase().replace(/\s+/g, '-')}-palette.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Palette downloaded as PNG!');
  };

  return (
    <div 
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`palette-card-${index}`}
    >
      <div className="flex h-32">
        {palette.colors.map((color, i) => (
          <ColorSwatch key={`${palette.id}-color-${i}`} color={color} colorIndex={i} />
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-lg truncate" data-testid={`palette-name-${index}`}>
              {palette.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{palette.description}</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(palette.id)}
              className={`transition-colors ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid={`favorite-button-${index}`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid={`export-button-${index}`}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPNG} data-testid={`export-png-${index}`}>
                  <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSS} data-testid={`export-css-${index}`}>
                  <Code className="w-4 h-4 mr-2" /> Copy CSS Variables
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON} data-testid={`export-json-${index}`}>
                  <FileJson className="w-4 h-4 mr-2" /> Copy JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {palette.psychology && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Color Psychology</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{palette.psychology}</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {palette.colors.map((color, i) => (
              <div key={`${palette.id}-detail-${i}`} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                <span className="text-muted-foreground">{color.usage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Message Component
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`} data-testid={`chat-message-${message.role}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-foreground text-background rounded-br-md' : 'bg-secondary text-foreground rounded-bl-md'}`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs mt-1 opacity-60">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// Chat Panel Component
function ChatPanel({ className = '' }) {
  const { 
    chatHistory, addChatMessage, clearChatHistory, isChatting, setIsChatting,
    rateLimits, setRateLimits, palettes, businessInfo, sessionId
  } = useAppContext();

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!inputValue.trim() || isChatting) return;
    if (rateLimits.revisions_remaining <= 0) {
      toast.error('Daily revision limit reached.');
      return;
    }
    if (palettes.length === 0) {
      toast.error('Please generate palettes first.');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    addChatMessage('user', userMessage);
    setIsChatting(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        context: {
          palettes: palettes.map(p => ({
            name: p.name,
            colors: p.colors.map(c => ({ hex: c.hex, name: c.name, usage: c.usage }))
          })),
          business_info: businessInfo
        },
        session_id: sessionId
      });
      addChatMessage('assistant', response.data.response);
      setRateLimits(prev => ({ ...prev, revisions_remaining: response.data.remaining_revisions }));
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Daily revision limit reached.');
        addChatMessage('assistant', 'Daily revision limit reached. Please try again tomorrow.');
      } else {
        toast.error('Failed to get response.');
        addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      }
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasNoPalettes = palettes.length === 0;
  const limitExceeded = rateLimits.revisions_remaining <= 0;

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="chat-panel">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="font-heading font-bold text-xl flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> AI Design Assistant
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {limitExceeded ? (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Limit reached
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {rateLimits.revisions_remaining}/3 revisions left
              </span>
            )}
          </div>
        </div>
        {chatHistory.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChatHistory} className="text-muted-foreground hover:text-destructive" data-testid="clear-chat-button">
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            {hasNoPalettes ? (
              <>
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">Generate palettes first to start chatting.</p>
              </>
            ) : (
              <>
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="font-medium mb-2">How can I help?</p>
                <p className="text-muted-foreground text-sm mb-4">Ask me to refine colors, explain psychology, or suggest alternatives.</p>
                <div className="space-y-2 w-full">
                  {['Make the primary color more vibrant', 'Suggest a warmer accent color', 'Explain the psychology behind palette 1'].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInputValue(suggestion)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      data-testid={`chat-suggestion-${i}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {chatHistory.map((msg, i) => <ChatMessage key={i} message={msg} />)}
            {isChatting && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasNoPalettes ? 'Generate palettes first...' : limitExceeded ? 'Daily limit reached' : 'Ask about colors, psychology...'}
            disabled={hasNoPalettes || isChatting || limitExceeded}
            className="flex-1"
            data-testid="chat-input"
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || hasNoPalettes || isChatting || limitExceeded} size="icon" data-testid="chat-send-button">
            {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
          <Palette className="w-16 h-16 text-muted-foreground/30" />
        </div>
      </div>
      <h3 className="font-heading font-bold text-2xl mb-2">No Palettes Yet</h3>
      <p className="text-muted-foreground max-w-sm">
        Fill in your business details above and click "Generate Palettes" to get AI-powered color recommendations.
      </p>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <Skeleton className="h-32 rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Content Component
function MainContent() {
  const { palettes, favorites, isGenerating, setRateLimits, clearAllData, rateLimits } = useAppContext();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const fetchRateLimits = async () => {
      try {
        const response = await axios.get(`${API}/rate-limit`);
        setRateLimits(response.data);
      } catch (error) {
        console.error('Failed to fetch rate limits:', error);
      }
    };
    fetchRateLimits();
  }, [setRateLimits]);

  const displayedPalettes = showFavoritesOnly ? palettes.filter(p => favorites.includes(p.id)) : palettes;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
      <main className="lg:col-span-8 xl:col-span-9 overflow-y-auto" data-testid="main-canvas">
        <div className="p-6 md:p-12">
          <header className="mb-8">
            <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight">
              ChromaBiz
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-xl">
              AI-powered color palettes tailored to your business, audience, and market.
            </p>
          </header>

          <InputForm />

          {palettes.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="font-heading font-bold text-2xl">Generated Palettes</h2>
                <span className="text-sm text-muted-foreground">
                  {palettes.length} palette{palettes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {favorites.length > 0 && (
                  <Button
                    variant={showFavoritesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    data-testid="filter-favorites-button"
                  >
                    <Star className={`w-4 h-4 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    Favorites ({favorites.length})
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllData}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid="clear-all-button"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Clear All
                </Button>
              </div>
            </div>
          )}

          {isGenerating ? (
            <LoadingSkeleton />
          ) : palettes.length === 0 ? (
            <EmptyState />
          ) : displayedPalettes.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite palettes yet</p>
              <Button variant="link" onClick={() => setShowFavoritesOnly(false)} className="mt-2">
                View all palettes
              </Button>
            </div>
          ) : (
            <div className="space-y-6" data-testid="palettes-container">
              {displayedPalettes.map((palette, index) => (
                <PaletteCard key={palette.id} palette={palette} index={index} />
              ))}
            </div>
          )}

          {palettes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {rateLimits.generations_remaining} generation{rateLimits.generations_remaining !== 1 ? 's' : ''} remaining today
              </p>
            </div>
          )}
        </div>
      </main>

      <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 h-screen border-l border-border bg-background/50 backdrop-blur-xl p-6 flex-col sticky top-0">
        <ChatPanel />
      </aside>

      <div className="lg:hidden fixed bottom-6 right-6 z-[9999]">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0" data-testid="mobile-chat-button">
              <MessageCircle className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <div className="h-full p-6">
              <ChatPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <div className="App min-h-screen bg-background">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="*" element={<MainContent />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </div>
    </AppProvider>
  );
}

export default App;
