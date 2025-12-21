import { cn } from '@/lib/utils';

interface EditorialContentProps {
  content: string;
  className?: string;
}

/**
 * Simple HTML sanitizer for editorial content.
 * Only allows safe tags used in our hardcoded editorial content.
 * This is defense-in-depth since content is from trusted source files.
 */
function sanitizeHtml(html: string): string {
  // Only allow specific safe tags used in editorial content
  const ALLOWED_TAGS = ['h2', 'h3', 'h4', 'p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br'];

  // Remove script tags and event handlers completely
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=/gi, ' data-removed=');

  // Strip tags not in allowlist (but keep their content)
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (ALLOWED_TAGS.includes(tagName.toLowerCase())) {
      // For anchor tags, only keep href attribute
      if (tagName.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
        if (hrefMatch && hrefMatch[1].startsWith('http')) {
          return match.startsWith('</') ? '</a>' : `<a href="${hrefMatch[1]}" rel="noopener noreferrer">`;
        }
        return ''; // Remove links without valid href
      }
      return match;
    }
    return ''; // Remove disallowed tags
  });

  return sanitized;
}

export function EditorialContent({ content, className }: EditorialContentProps) {
  const sanitizedContent = sanitizeHtml(content);

  return (
    <section className={cn('container-brutal py-10', className)}>
      <div className="prose prose-forest max-w-none font-body text-bark/80 leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>
    </section>
  );
}
