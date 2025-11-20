import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Globe, Settings2, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { getCurrentTargetUrl, setTargetUrl, resetTargetUrl } from '@/lib/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth/auth';

const PRESET_TARGETS = [
  { name: 'Djibouti Staging', url: 'https://djibouti-staging.tekdinext.com' },
];

export function TargetUrlSelector() {
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setCurrentTarget(getCurrentTargetUrl());
  }, []);

  const handlePresetSelect = (url: string) => {
    if (isAuthenticated && currentTarget !== url) {
      toast({
        title: "Target URL Changed - Logged Out",
        description: `You have been logged out because tokens are environment-specific. Please log in again with the new target: ${url}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Target URL Updated",
        description: `All API calls will now be proxied to: ${url}`,
      });
    }
    
    setTargetUrl(url);
    setCurrentTarget(url);
  };

  const handleCustomUrlSave = () => {
    if (!customUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(customUrl); // Validate URL format
      
      if (isAuthenticated && currentTarget !== customUrl) {
        toast({
          title: "Custom Target URL Set - Logged Out",
          description: `You have been logged out because tokens are environment-specific. Please log in again with the new target: ${customUrl}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Custom Target URL Set",
          description: `All API calls will now be proxied to: ${customUrl}`,
        });
      }
      
      setTargetUrl(customUrl);
      setCurrentTarget(customUrl);
      setIsDialogOpen(false);
      setCustomUrl('');
    } catch {
      toast({
        title: "Invalid URL Format",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    const defaultTarget = 'https://djibouti.tekdinext.com'; // Default target
    
    if (isAuthenticated && currentTarget !== defaultTarget) {
      toast({
        title: "Target URL Reset - Logged Out",
        description: `You have been logged out because tokens are environment-specific. Please log in again with the default target: ${defaultTarget}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Target URL Reset",
        description: `Reset to default: ${defaultTarget}`,
      });
    }
    
    resetTargetUrl();
    setCurrentTarget(getCurrentTargetUrl());
  };

  const getCurrentTargetName = () => {
    const preset = PRESET_TARGETS.find(target => target.url === currentTarget);
    return preset ? preset.name : 'Custom';
  };

  const isCustomTarget = () => {
    return !PRESET_TARGETS.some(target => target.url === currentTarget);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Target:</span>
          <Badge variant={isCustomTarget() ? "secondary" : "default"} className="text-xs">
            {getCurrentTargetName()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          API Target URL Configuration
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <div className="text-xs text-muted-foreground mb-2">
            Current target: {currentTarget}
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
              <AlertTriangle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
              <span className="text-yellow-800">
                Changing target will log you out
              </span>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Preset Environments
        </DropdownMenuLabel>
        
        {PRESET_TARGETS.map((target) => (
          <DropdownMenuItem
            key={target.url}
            onClick={() => handlePresetSelect(target.url)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{target.name}</span>
              <span className="text-xs text-muted-foreground">{target.url}</span>
            </div>
            {currentTarget === target.url && <Check className="h-4 w-4 text-green-600" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Settings2 className="mr-2 h-4 w-4" />
              Set Custom URL
            </DropdownMenuItem>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Custom Target URL</DialogTitle>
              <DialogDescription>
                Enter a custom URL for API proxy requests. All API calls will be forwarded to this target.
              </DialogDescription>
            </DialogHeader>
            
            {isAuthenticated && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Warning: Changing the target URL will log you out since authentication tokens are environment-specific.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="custom-url" className="text-sm font-medium">
                  Target URL
                </label>
                <Input
                  id="custom-url"
                  placeholder="https://your-custom-domain.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCustomUrlSave}>
                Set Target
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <DropdownMenuItem onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 