import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getMyPhoto, uploadMyPhoto, removeMyPhoto } from '../../lib/profileApi';
import { toast } from 'react-toastify';

interface ProfileAvatarProps {
  /** User's full name — used for the initials fallback */
  fullName: string;
  /** Tailwind size classes, e.g. "w-20 h-20 md:w-24 md:h-24" */
  sizeClass?: string;
  /** Tailwind text size classes for initials, e.g. "text-2xl md:text-3xl" */
  textClass?: string;
  /** Accent color for the initials fallback (hex) */
  accentColor?: string;
  /** When false the photo is shown read-only (no upload/remove controls) */
  editable?: boolean;
  /** Extra classes on the wrapper */
  className?: string;
}

/**
 * Reads a File and returns a downscaled square-cropped base64 data URL
 * (max 320px) so uploads stay small regardless of the source image.
 */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const target = 320;
        const canvas = document.createElement('canvas');
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        // Square center-crop
        ctx.drawImage(
          img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          target,
          target
        );
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

/**
 * Profile avatar with initials fallback and optional hover upload/remove.
 * The photo is unique per user — the backend enforces a single record
 * and re-uploading replaces it.
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  fullName,
  sizeClass = 'w-20 h-20 md:w-24 md:h-24',
  textClass = 'text-2xl md:text-3xl',
  accentColor = '#f97316',
  editable = true,
  className = '',
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const { data: photoUrl, isLoading } = useQuery<string | null, Error>({
    queryKey: ['profile', 'photo'],
    queryFn: getMyPhoto,
    staleTime: 1000 * 60 * 5,
  });

  const uploadMutation = useMutation<string, Error, string>({
    mutationFn: uploadMyPhoto,
    onSuccess: (url) => {
      queryClient.setQueryData(['profile', 'photo'], url);
      toast.success('Profile photo updated.');
    },
    onError: (err) =>
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to upload photo.'),
  });

  const removeMutation = useMutation<void, Error>({
    mutationFn: removeMyPhoto,
    onSuccess: () => {
      queryClient.setQueryData(['profile', 'photo'], null);
      toast.info('Profile photo removed.');
    },
    onError: () => toast.error('Failed to remove photo.'),
  });

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Ask for a fresh photo if the cache is empty but one may exist
  useEffect(() => {
    if (photoUrl === null) {
      queryClient.invalidateQueries({ queryKey: ['profile', 'photo'] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPEG, WebP, or GIF).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image is too large. Please choose one under 8 MB.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      uploadMutation.mutate(dataUrl);
    } catch {
      toast.error('Could not process that image. Try another file.');
    }
  };

  const showImage = !!photoUrl && !isLoading;

  return (
    <div
      className={clsx('relative flex-shrink-0', className)}
      onMouseEnter={() => editable && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className={clsx(
          sizeClass,
          'rounded-2xl flex items-center justify-center text-white font-black shadow-2xl overflow-hidden'
        )}
        style={{
          background: showImage
            ? undefined
            : `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)`,
          boxShadow: `0 8px 32px ${accentColor}44`,
        }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin opacity-60" />
        ) : showImage ? (
          <img src={photoUrl!} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span className={textClass}>{initials}</span>
        )}
      </div>

      {/* Hover controls (profile page only) */}
      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          {isHovering && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-black/50 flex items-center justify-center gap-2 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="p-2 rounded-lg bg-white/90 hover:bg-white text-[#1A1A1A] transition-colors disabled:opacity-50"
                title={photoUrl ? 'Change photo' : 'Upload photo'}
                aria-label={photoUrl ? 'Change photo' : 'Upload photo'}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="p-2 rounded-lg bg-white/90 hover:bg-white text-[#DC2626] transition-colors disabled:opacity-50"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfileAvatar;
