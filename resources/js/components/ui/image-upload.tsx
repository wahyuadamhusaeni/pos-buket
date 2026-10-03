import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
    id?: string;
    currentImageUrl?: string | null;
    value?: File | null;
    onChange: (file: File | null) => void;
    onRemoveExisting?: () => void;
    label?: string;
    description?: string;
    error?: string;
}

export function ImageUpload({
    id = 'image-upload',
    currentImageUrl,
    value,
    onChange,
    onRemoveExisting,
    label = 'Foto / Gambar',
    description = 'Format JPG, PNG, atau WEBP (maks. 5MB)',
    error,
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Sync preview URL when value changes
    React.useEffect(() => {
        if (!value) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(value);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [value]);

    const handleFileSelect = (file: File | null) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Silakan pilih file gambar yang valid (JPG, PNG, WEBP).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran gambar terlalu besar (maksimal 5MB).');
            return;
        }

        onChange(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onRemoveExisting) {
            onRemoveExisting();
        }
    };

    const displayImage = previewUrl || currentImageUrl;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                {displayImage && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                        <Trash2 className="h-3 w-3" />
                        Hapus Foto
                    </button>
                )}
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
                    dragOver
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                        : displayImage
                        ? 'border-border/60 hover:border-rose-400 bg-muted/20'
                        : 'border-border/60 hover:border-rose-400 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 bg-muted/10'
                }`}
            >
                <input
                    ref={fileInputRef}
                    id={id}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                        }
                    }}
                />

                {displayImage ? (
                    <div className="relative aspect-video w-full max-h-56 flex items-center justify-center bg-neutral-900/5 dark:bg-neutral-900/40 p-2">
                        <img
                            src={displayImage}
                            alt="Preview"
                            className="max-h-52 w-auto object-contain rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[2px]">
                            <Camera className="h-4 w-4" />
                            Klik untuk ganti foto
                        </div>
                    </div>
                ) : (
                    <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                            <UploadCloud className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Klik untuk unggah foto atau seret ke sini
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {description}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-xs font-medium text-destructive mt-1">{error}</p>}
        </div>
    );
}
