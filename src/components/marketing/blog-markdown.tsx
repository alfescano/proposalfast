import Link from "next/link";
import Markdown from "react-markdown";

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <div className="text-muted-foreground [&_a]:text-foreground [&_blockquote]:border-accent [&_h2]:text-foreground [&_h2]:font-heading [&_h3]:text-foreground [&_h3]:font-heading [&_strong]:text-foreground mt-10 space-y-5 text-base leading-7 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:text-2xl [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:max-w-prose [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h2 className="text-foreground font-heading mt-10 text-3xl">
              {children}
            </h2>
          ),
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            if (isInternalHref(href)) {
              return <Link href={href}>{children}</Link>;
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
