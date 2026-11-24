/**
 * Customer-facing policy pages. Values that the owner controls in Admin → Settings (cutoff, delivery time,
 * city, WhatsApp) are passed in so the text never drifts from how the shop actually runs.
 * Keep the wording plain; have it reviewed before launch.
 */
export type LegalSlug = 'delivery' | 'refunds' | 'privacy' | 'terms';

export interface LegalSection {
  id: string;
  heading: string;
  /** Strings are paragraphs; string arrays are bullet lists. */
  body: (string | string[])[];
}

export interface LegalPageContent {
  slug: LegalSlug;
  path: `/${LegalSlug}`;
  nav: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED = '24 November 2026';

interface Info {
  cutoff: string;
  by: string;
  city: string;
  whatsappDisplay: string;
}

export function legalPages(i: Info): LegalPageContent[] {
  const wa = `WhatsApp ${i.whatsappDisplay}`;
  return [
    {
      slug: 'delivery',
      path: '/delivery',
      nav: 'Delivery',
      title: 'Delivery policy',
      intro: `We prepare everything fresh on the morning of delivery, so we take orders a night ahead and deliver across ${i.city} the next day.`,
      sections: [
        {
          id: 'when',
          heading: 'When we deliver',
          body: [
            `Order before ${i.cutoff} and we deliver the next day by ${i.by}.`,
            `Orders placed after ${i.cutoff} are delivered the day after tomorrow. At checkout you can also pick a later delivery day from the days shown.`,
            'If we have to pause ordering (for example on public holidays), a notice appears at the top of the website and checkout is closed until we reopen.',
          ],
        },
        {
          id: 'where',
          heading: 'Where we deliver',
          body: [
            `We currently deliver in ${i.city}. Choose your area at checkout — only areas we deliver to are listed. If your area is missing, message us on ${wa} and we will try to help.`,
          ],
        },
        {
          id: 'fees',
          heading: 'Delivery fees',
          body: [
            'The delivery fee depends on your area and is shown at checkout before you place your order. Some areas have free delivery.',
          ],
        },
        {
          id: 'confirmation',
          heading: 'Order confirmation',
          body: [
            'After you place an order we may call or message you on WhatsApp to confirm it. Please keep your phone reachable — we may not be able to deliver orders we cannot confirm.',
            'You can follow your order any time on the Track order page using your order number and phone number.',
          ],
        },
        {
          id: 'receiving',
          heading: 'Receiving your order',
          body: [
            [
              'Our rider will call when they are close. Please make sure someone is available to receive and pay.',
              'Pay the rider in cash. Having the exact amount ready is appreciated.',
              'Check your items at the door. If anything is wrong or damaged, tell the rider straight away (see our Refund & return policy).',
              'Put fresh items in the fridge as soon as they arrive.',
            ],
          ],
        },
        {
          id: 'missed',
          heading: 'If we miss you',
          body: [
            'If the rider cannot reach you, we will try to arrange another time the same day. Because our products are fresh and perishable, we may not be able to hold an order for another day.',
          ],
        },
      ],
    },
    {
      slug: 'refunds',
      path: '/refunds',
      nav: 'Refunds & returns',
      title: 'Refund & return policy',
      intro:
        'Our food is fresh and perishable, so we cannot take items back once they have been delivered and accepted. But if something is not right, we will make it right.',
      sections: [
        {
          id: 'at-the-door',
          heading: 'Check your order at the door',
          body: [
            'Please check your items when the rider arrives. If an item is missing, wrong, leaking or damaged, you can refuse that item and you will not be charged for it.',
          ],
        },
        {
          id: 'after-delivery',
          heading: 'Problems after delivery',
          body: [
            `If you find a problem after the rider has left, message us on ${wa} within 24 hours of delivery with your order number and a photo. We will replace the item on your next delivery or refund it — your choice.`,
            [
              'Item missing or different from what you ordered',
              'Item spoiled or not fresh on arrival',
              'Packaging damaged so the item is unusable',
            ],
          ],
        },
        {
          id: 'not-covered',
          heading: 'What we cannot refund',
          body: [
            [
              'Items that were stored incorrectly after delivery (for example kept out of the fridge)',
              'Items used past the date on the label',
              'Change of mind once an order has been prepared',
              'Problems reported more than 24 hours after delivery',
            ],
          ],
        },
        {
          id: 'cancel',
          heading: 'Cancelling an order',
          body: [
            `You can cancel free of charge before ${i.cutoff} on the night before delivery — just message us on ${wa} with your order number.`,
            `After ${i.cutoff} we have usually started buying and preparing your items, so we may not be able to cancel. Message us anyway and we will do our best.`,
          ],
        },
        {
          id: 'how-refunds',
          heading: 'How refunds are paid',
          body: [
            'As our orders are cash on delivery, approved refunds are paid in cash with your next delivery or by mobile wallet / bank transfer to the number or account you give us, within 3 working days.',
            'If we cancel your order or cannot deliver it for reasons on our side, you will not pay anything, including the delivery fee.',
          ],
        },
      ],
    },
    {
      slug: 'privacy',
      path: '/privacy',
      nav: 'Privacy',
      title: 'Privacy policy',
      intro:
        'We only collect what we need to prepare and deliver your order, and we never sell your information. This page explains what we collect and how we use it.',
      sections: [
        {
          id: 'collect',
          heading: 'What we collect',
          body: [
            [
              'Your name and mobile / WhatsApp number',
              'Your delivery address, area and nearest landmark',
              'Your order details and any notes you add',
              'Your number, if you ask us to tell you about deals (“Notify me”)',
            ],
            'We do not ask for card or bank details — all orders are cash on delivery — and you do not need an account or password to order.',
          ],
        },
        {
          id: 'use',
          heading: 'How we use it',
          body: [
            [
              'To prepare and deliver your order',
              'To confirm your order and update you by call or WhatsApp',
              'To show your order status on the Track order page (you need both your order number and phone number)',
              'To handle questions, refunds and problems',
              'To plan how much to prepare each day',
              'To tell you about deals — only if you signed up, and you can stop any time by messaging us',
            ],
          ],
        },
        {
          id: 'share',
          heading: 'Who we share it with',
          body: [
            'We do not sell or rent your information. We share only what is needed:',
            [
              'Our delivery riders see your name, phone number, address and order total so they can deliver.',
              'Service providers that run our website and send our internal order alerts (for example our hosting and database provider). They may only use the data to provide their service to us.',
              'Authorities, if the law requires it.',
            ],
          ],
        },
        {
          id: 'storage',
          heading: 'How long we keep it',
          body: [
            'We keep order records for as long as we need them for deliveries, accounting and customer support. You can ask us to delete your details at any time; we may keep basic order records where we are required to.',
          ],
        },
        {
          id: 'browser',
          heading: 'Cookies and your browser',
          body: [
            'We do not use advertising or tracking cookies. Your cart is saved in your own browser so it is still there when you come back; it is not sent to us until you place an order.',
          ],
        },
        {
          id: 'rights',
          heading: 'Your choices',
          body: [
            `You can ask us what information we hold about you, ask us to correct it, or ask us to delete it. Message us on ${wa}.`,
          ],
        },
      ],
    },
    {
      slug: 'terms',
      path: '/terms',
      nav: 'Terms',
      title: 'Terms & conditions',
      intro:
        'These terms apply when you use the Preppal website or place an order with us. By placing an order you agree to them.',
      sections: [
        {
          id: 'orders',
          heading: 'Orders',
          body: [
            `Orders placed before ${i.cutoff} are delivered the next day by ${i.by}; later orders roll to the following day. Our Delivery policy has the details.`,
            'An order is accepted once we confirm it. We may decline or cancel an order — for example if an item sells out, your area is outside our delivery zone, or we cannot reach you to confirm. If that happens you will not be charged.',
          ],
        },
        {
          id: 'prices',
          heading: 'Prices and payment',
          body: [
            'Prices are in Pakistani rupees. The price you pay is the price shown when you place your order, plus the delivery fee for your area shown at checkout.',
            'Payment is cash on delivery. A minimum order amount may apply and is shown in your cart.',
          ],
        },
        {
          id: 'products',
          heading: 'Our products',
          body: [
            'Our products are fresh and prepared to order. Photos are for illustration; natural ingredients vary a little in colour and size.',
            'Ingredients are listed on each product page. If you have an allergy, please message us before ordering.',
            'Keep items refrigerated and use them by the date on the label. We are not responsible for problems caused by incorrect storage after delivery.',
          ],
        },
        {
          id: 'cancellations',
          heading: 'Cancellations and refunds',
          body: ['Cancellations, returns and refunds are covered by our Refund & return policy.'],
        },
        {
          id: 'liability',
          heading: 'Our responsibility',
          body: [
            'If something goes wrong with an order because of us, our responsibility is limited to replacing the affected items or refunding what you paid for them. Nothing in these terms takes away rights you have by law.',
          ],
        },
        {
          id: 'website',
          heading: 'Using the website',
          body: [
            'Please give accurate details when ordering and do not misuse the website. The Preppal name, logo, text and photos on this site belong to Preppal or are used with permission.',
          ],
        },
        {
          id: 'changes',
          heading: 'Changes to these terms',
          body: [
            'We may update these terms from time to time. The version on this page when you place an order is the one that applies. These terms are governed by the laws of Pakistan.',
          ],
        },
        {
          id: 'contact',
          heading: 'Contact us',
          body: [`Questions about these terms? Message us on ${wa}.`],
        },
      ],
    },
  ];
}
