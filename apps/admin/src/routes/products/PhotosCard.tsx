import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { IconImage, IconStar, IconX } from '../../components/icons';
import { useFeedback } from '../../components/overlays';
import { Card } from '../../components/ui';
import { send } from '../../lib/api';
import { toWebp } from '../../lib/image';

const MAX_PHOTOS = 8;
export interface Photo {
  key: string;
  url: string;
}

/** Photo grid: first photo is the cover. Upload (click or drop), make cover, remove. */
export function PhotosCard({ photos, onChange }: { photos: Photo[]; onChange: (p: Photo[]) => void }) {
  const { toast } = useFeedback();
  const [dragging, setDragging] = useState(false);
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const room = MAX_PHOTOS - photos.length;
      const out: Photo[] = [];
      for (const file of files.filter((f) => f.type.startsWith('image/')).slice(0, room)) {
        const fd = new FormData();
        fd.append('file', new File([await toWebp(file)], 'image.webp', { type: 'image/webp' }));
        const r = await send<{ key: string; url: string }>('POST', '/admin/uploads', fd);
        out.push({ key: r.key, url: r.url });
      }
      return out;
    },
    onSuccess: (added) => {
      onChange([...photos, ...added]);
      if (added.length)
        toast(`${added.length} photo${added.length === 1 ? '' : 's'} added — remember to save`);
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });
  const full = photos.length >= MAX_PHOTOS;

  return (
    <Card
      title="Photos"
      description="The first photo is the cover on the storefront. Images are resized in your browser before upload."
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
        {photos.map((p, i) => (
          <div
            key={p.key}
            className="group relative aspect-square overflow-hidden rounded-xl bg-sand ring-1 ring-line"
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-forest px-2 py-0.5 text-[11px] font-bold text-white">
                Cover
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onChange([p, ...photos.filter((_, j) => j !== i)])}
                className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-forest opacity-0 shadow-card transition group-hover:opacity-100 focus:opacity-100"
              >
                <IconStar width={12} height={12} /> Make cover
              </button>
            )}
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink opacity-0 shadow-card transition group-hover:opacity-100 hover:bg-terra hover:text-white focus:opacity-100"
            >
              <IconX width={14} height={14} />
            </button>
          </div>
        ))}
        {!full && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              upload.mutate([...e.dataTransfer.files]);
            }}
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-3 text-center transition ${
              dragging
                ? 'border-forest bg-sage-soft'
                : 'border-line-strong hover:border-forest hover:bg-canvas'
            }`}
          >
            <IconImage className="text-forest" width={24} height={24} />
            <span className="text-[13px] font-semibold text-forest">
              {upload.isPending ? 'Uploading…' : 'Add photos'}
            </span>
            <span className="text-[11px] text-muted">Click or drop · {MAX_PHOTOS - photos.length} left</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={upload.isPending}
              onChange={(e) => {
                upload.mutate([...(e.target.files ?? [])]);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    </Card>
  );
}
