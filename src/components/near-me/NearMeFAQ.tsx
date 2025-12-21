import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface NearMeFAQProps {
  faqs: FAQItem[];
  title?: string;
}

export function NearMeFAQ({ faqs, title = 'Frequently Asked Questions' }: NearMeFAQProps) {
  return (
    <section className="container-brutal py-12 border-t border-forest/10">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-forest mb-8">{title}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={cn(
              'bg-cream rounded-xl p-6 border border-forest/8',
              'hover:border-forest/15 transition-colors'
            )}
          >
            <h3 className="font-display font-semibold text-forest text-lg mb-3">{faq.question}</h3>
            <p className="text-bark/70 font-body leading-relaxed text-sm">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Generate FAQPage structured data for SEO
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
