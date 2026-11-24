import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useFeedback } from '../../components/overlays';
import { type AdminProduct, productBody, send } from '../../lib/api';

/** Delete / duplicate / publish for products, shared by the list and the editor. */
export function useProductActions() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['categories'] }),
      qc.invalidateQueries({ queryKey: ['inventory'] }),
    ]);
  const onError = (e: Error) => toast(e.message, 'error');

  const remove = useMutation({
    mutationFn: (p: AdminProduct) => send('DELETE', `/admin/products/${p.id}`),
    onSuccess: async (_r, p) => {
      await refresh();
      qc.removeQueries({ queryKey: ['product', p.id] });
      toast(`${p.name} deleted`);
    },
    onError,
  });

  const duplicate = useMutation({
    mutationFn: async (p: AdminProduct) => {
      const suffix = Date.now().toString(36).slice(-4);
      const { id } = await send<{ id: string }>('POST', '/admin/products', {
        ...productBody(p),
        name: `${p.name} (copy)`,
        slug: `${p.slug}-copy-${suffix}`,
        status: 'draft',
      });
      for (const v of p.variants) {
        await send('POST', `/admin/products/${id}/variants`, {
          label: v.label,
          sku: `${v.sku}-C${suffix}`.slice(0, 40),
          pricePkr: v.pricePkr,
          unitNote: v.unitNote,
          sortOrder: v.sortOrder,
          isActive: v.isActive,
        });
      }
      return id;
    },
    onSuccess: async (id, p) => {
      await refresh();
      toast(`Copied ${p.name} as a draft`);
      navigate({ to: '/products/$id', params: { id } });
    },
    onError,
  });

  const setStatus = useMutation({
    mutationFn: (v: { p: AdminProduct; status: AdminProduct['status'] }) =>
      send('PUT', `/admin/products/${v.p.id}`, { ...productBody(v.p), status: v.status }),
    onSuccess: async (_r, v) => {
      await refresh();
      await qc.invalidateQueries({ queryKey: ['product', v.p.id] });
      toast(
        v.status === 'active'
          ? `${v.p.name} is live`
          : v.status === 'draft'
            ? `${v.p.name} hidden (draft)`
            : `${v.p.name} archived`,
      );
    },
    onError,
  });

  const askDelete = async (p: AdminProduct, after?: () => void) => {
    const ok = await confirm({
      title: `Delete ${p.name}?`,
      body: `This removes the product, its ${p.variants.length} size${p.variants.length === 1 ? '' : 's'} and stock settings. Past orders keep their details. To hide it temporarily, set it to Draft instead.`,
      confirmLabel: 'Delete product',
      danger: true,
    });
    if (ok) remove.mutate(p, { onSuccess: () => after?.() });
  };

  return { askDelete, remove, duplicate, setStatus };
}
