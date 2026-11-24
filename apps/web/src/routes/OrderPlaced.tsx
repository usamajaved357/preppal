import { formatDeliveryDate, formatPkr, type OrderCreatedDto } from '@preppal/shared';
import { Link, useParams } from '@tanstack/react-router';
import { IconCheck, IconWhatsApp } from '../components/icons';
import { useStoreInfo } from '../lib/store-info';

export function OrderPlacedPage() {
  const { number } = useParams({ from: '/order/$number' });
  const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`order:${number}`) : null;
  const order = raw ? (JSON.parse(raw) as OrderCreatedDto) : null;
  const { by } = useStoreInfo();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="relative grid h-20 w-20 animate-pop place-items-center rounded-full bg-sage-soft text-forest before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-sage/50 before:[animation-iteration-count:2] [&>svg]:relative">
          <IconCheck width={38} height={38} />
        </span>
        <h1 className="text-[34px] font-semibold">Shukriya! Order placed.</h1>
        <p className="text-muted">We'll prepare your order fresh on the morning of delivery.</p>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
        <Row k="Order no." v={number} />
        {order && <Row k="Delivery" v={`${formatDeliveryDate(order.deliveryDate)} · by ${by}`} />}
        {order && <Row k="Pay on delivery" v={formatPkr(order.totalPkr)} strong />}
      </div>
      {order && (
        <a
          href={order.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-forest font-bold text-white"
        >
          <IconWhatsApp /> Send order on WhatsApp
        </a>
      )}
      <Link
        to="/track"
        search={{ number }}
        className="flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-forest font-semibold text-forest"
      >
        Track this order
      </Link>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{k}</span>
      <span className={strong ? 'font-bold text-forest' : 'font-semibold'}>{v}</span>
    </div>
  );
}
