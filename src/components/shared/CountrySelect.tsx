'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    useGetCountriesQuery,
    useAddCountryMutation,
} from '@/redux/features/country/countryApi';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '../ui/label';

type CountrySelectProps = {
    value: string | null;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
};

export function CountrySelect({
    value,
    onChange,
    className,
    disabled = false,
}: CountrySelectProps) {
    const [open, setOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [newCountry, setNewCountry] = React.useState('');

    // API hooks
    const { data: countries, isLoading, refetch } = useGetCountriesQuery({});
    const [addCountry, { isLoading: adding }] = useAddCountryMutation();

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number>();

    React.useEffect(() => {
        if (triggerRef.current) setTriggerWidth(triggerRef.current.offsetWidth);
    }, [open]);

    const handleAddCountry = async () => {
        if (!newCountry.trim()) return;
        try {
            await addCountry({ name: newCountry.trim() }).unwrap();
            toast.success('Country added successfully');
            setNewCountry('');
            setDialogOpen(false);
            refetch();
        } catch (err) {
            toast.error((err as Error).message || 'Failed to add country');
        }
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {isLoading ? (
                <Skeleton className="h-10 w-48 rounded-md" />
            ) : (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            ref={triggerRef}
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className="flex-1 justify-between capitalize rounded-md border-gray-300 hover:border-gray-400 transition"
                        >
                            {value || 'Select country...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="p-0 rounded-md shadow-md border border-gray-200"
                        style={{ width: triggerWidth }}
                    >
                        <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                    {countries?.map(
                                        (c: { _id: string; name: string }) => (
                                            <CommandItem
                                                key={c._id}
                                                className="capitalize"
                                                value={c.name}
                                                onSelect={(currentValue) => {
                                                    onChange(currentValue);
                                                    setOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4 text-primary transition-opacity',
                                                        value === c.name
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    )}
                                                />
                                                {c.name}
                                            </CommandItem>
                                        )
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-md border-gray-300 hover:bg-accent hover:text-accent-foreground transition"
                        title="Add Country"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">
                            Add New Country
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <Label htmlFor="country-name">Country Name</Label>
                        <Input
                            id="country-name"
                            placeholder="Enter country name"
                            value={newCountry}
                            onChange={(e) => setNewCountry(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleAddCountry}
                            disabled={adding || !newCountry.trim()}
                            className="w-auto"
                        >
                            {adding ? <Spinner /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
