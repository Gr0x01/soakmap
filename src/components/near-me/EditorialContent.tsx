import { cn } from '@/lib/utils';

interface EditorialContentProps {
  content: string;
  className?: string;
}

export function EditorialContent({ content, className }: EditorialContentProps) {
  return (
    <section className={cn('container-brutal py-10', className)}>
      <div className="prose prose-forest max-w-none font-body text-bark/80 leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </section>
  );
}
