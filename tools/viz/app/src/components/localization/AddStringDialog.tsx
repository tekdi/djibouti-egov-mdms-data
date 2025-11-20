import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLocalizationApi } from '@/lib/api/localization';

interface AddStringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: string[];
  onSuccess: () => void;
}

export function AddStringDialog({
  open,
  onOpenChange,
  modules,
  onSuccess,
}: AddStringDialogProps) {
  const [code, setCode] = useState('');
  const [module, setModule] = useState<string | undefined>(undefined);
  const [baseText, setBaseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { upsertLocalizationString } = useLocalizationApi();

  // Filter out any empty strings from modules to prevent Select.Item errors
  const validModules = modules.filter(m => m && m.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !module || !baseText) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertLocalizationString(code, baseText, module, 'en');
      toast({
        title: 'Success',
        description: 'New localization string added successfully.',
      });
      onSuccess();
      onOpenChange(false);
      setCode('');
      setModule(undefined);
      setBaseText('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add string',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Localization String</DialogTitle>
          <DialogDescription>
            Add a new localization string with base language (English) text.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Locale Code
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="col-span-3"
                placeholder="Enter locale code"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="module" className="text-right">
                Module
              </Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {validModules.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseText" className="text-right">
                Base Text (EN)
              </Label>
              <Input
                id="baseText"
                value={baseText}
                onChange={(e) => setBaseText(e.target.value)}
                className="col-span-3"
                placeholder="Enter English text"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add String'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
