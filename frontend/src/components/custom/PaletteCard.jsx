import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Copy, Check, Star, Download, Code, FileJson, Image } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Helper function to determine text color based on background
const getContrastColor = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Helper to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }
  return { r: 0, g: 0, b: 0 };
};

const ColorSwatch = ({ color, index }) => {
  const [copied, setCopied] = useState(false);
  const rgb = hexToRgb(color.hex);
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="flex-1 h-32 relative group cursor-pointer transition-all duration-300 hover:flex-[1.5] first:rounded-l-lg last:rounded-r-lg overflow-hidden"
            style={{ backgroundColor: color.hex }}
            aria-label={`Color ${color.hex}`}
            data-testid={`color-swatch-${index}`}
          >
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ color: textColor }}
            >
              {copied ? (
                <Check className="w-5 h-5 mb-1" />
              ) : (
                <Copy className="w-5 h-5 mb-1" />
              )}
              <span className="font-mono text-xs font-bold">{color.hex}</span>
              <span className="text-xs mt-1 px-2 text-center">{color.name}</span>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-bold">{color.name}</p>
            <p className="font-mono text-sm">{color.hex}</p>
            <p className="font-mono text-sm">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
            <p className="text-muted-foreground text-xs">{color.usage}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const PaletteCard = ({ palette, index }) => {
  const { favorites, toggleFavorite } = useAppContext();
  const isFavorite = favorites.includes(palette.id);

  const handleExportCSS = () => {
    const cssVars = palette.colors
      .map((c, i) => `  --color-${c.usage.toLowerCase().replace(/\s+/g, '-')}: ${c.hex};`)
      .join('\n');
    const css = `:root {\n${cssVars}\n}`;
    
    navigator.clipboard.writeText(css);
    toast.success('CSS variables copied to clipboard!');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(palette, null, 2);
    navigator.clipboard.writeText(json);
    toast.success('JSON copied to clipboard!');
  };

  const handleDownloadPNG = async () => {
    // Create a canvas to render the palette
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const colorWidth = 200;
    const height = 300;
    canvas.width = colorWidth * palette.colors.length;
    canvas.height = height;

    // Draw colors
    palette.colors.forEach((color, i) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(i * colorWidth, 0, colorWidth, height - 50);
      
      // Add hex text
      ctx.fillStyle = getContrastColor(color.hex);
      ctx.font = 'bold 16px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(color.hex, i * colorWidth + colorWidth / 2, height - 80);
    });

    // Add palette name at bottom
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, height - 50, canvas.width, 50);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Syne, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(palette.name, 20, height - 18);

    // Download
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
      {/* Color Strip */}
      <div className="flex h-32">
        {palette.colors.map((color, i) => (
          <ColorSwatch key={i} color={color} index={i} />
        ))}
      </div>

      {/* Info Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-lg truncate" data-testid={`palette-name-${index}`}>
              {palette.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {palette.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(palette.id)}
              className={`transition-colors ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid={`favorite-button-${index}`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid={`export-button-${index}`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPNG} data-testid={`export-png-${index}`}>
                  <Image className="w-4 h-4 mr-2" />
                  Download PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSS} data-testid={`export-css-${index}`}>
                  <Code className="w-4 h-4 mr-2" />
                  Copy CSS Variables
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON} data-testid={`export-json-${index}`}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Copy JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Psychology */}
        {palette.psychology && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">
              Color Psychology
            </p>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {palette.psychology}
            </p>
          </div>
        )}

        {/* Color Details */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {palette.colors.map((color, i) => (
              <div 
                key={i}
                className="flex items-center gap-1.5 text-xs"
              >
                <div 
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-muted-foreground">{color.usage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
