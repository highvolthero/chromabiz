import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Copy, Check, Star, Download, Code, FileJson, ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const getContrastColor = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  }
  return 'rgb(0, 0, 0)';
};

const ColorSwatch = ({ color, colorIndex }) => {
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
        {copied ? (
          <Check className="w-5 h-5 mb-1" />
        ) : (
          <Copy className="w-5 h-5 mb-1" />
        )}
        <span className="font-mono text-xs font-bold">{color.hex}</span>
        <span className="text-xs mt-1 px-2 text-center truncate max-w-full">{color.name}</span>
      </div>
    </button>
  );
};

export const PaletteCard = ({ palette, index }) => {
  const { favorites, toggleFavorite } = useAppContext();
  const isFavorite = favorites.includes(palette.id);

  const handleExportCSS = () => {
    const cssVars = palette.colors
      .map((c) => `  --color-${c.usage.toLowerCase().replace(/\s+/g, '-')}: ${c.hex};`)
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
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {palette.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid={`export-button-${index}`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPNG} data-testid={`export-png-${index}`}>
                  <ImageIcon className="w-4 h-4 mr-2" />
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

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {palette.colors.map((color, i) => (
              <div 
                key={`${palette.id}-detail-${i}`}
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
