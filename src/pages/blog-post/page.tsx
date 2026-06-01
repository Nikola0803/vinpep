import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getBlogPostById, getRelatedPosts } from '../../mocks/blog';
import PageLayout from '../../components/feature/PageLayout';

function MarkdownContent({ content }: { content: string }) {
  const sections = content.trim().split('\n\n');

  return (
    <div>
      {sections.map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="font-display text-lg tracking-wider uppercase text-espresso mt-10 mb-4">
              {trimmed.replace('## ', '')}
            </h2>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="font-display text-sm tracking-wider uppercase text-espresso mt-8 mb-3">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        if (trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- '));
          return (
            <ul key={idx} className="space-y-2 mb-4 ml-4">
              {items.map((item, i) => (
                <li key={i} className="font-body text-sm text-saddle leading-relaxed flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass mt-2 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{
                    __html: item.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </li>
              ))}
            </ul>
          );
        }

        if (/^\d+\./.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\./.test(l.trim()));
          return (
            <ol key={idx} className="space-y-2 mb-4 ml-4 list-decimal list-inside">
              {items.map((item, i) => (
                <li key={i} className="font-body text-sm text-saddle leading-relaxed">
                  <span dangerouslySetInnerHTML={{
                    __html: item.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p
            key={idx}
            className="font-body text-sm text-saddle leading-relaxed mb-4"
            dangerouslySetInnerHTML={{
              __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-espresso">$1</strong>')
            }}
          />
        );
      })}
    </div>
  );
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const post = id ? getBlogPostById(id) : undefined;
  const relatedPosts = id ? getRelatedPosts(id, 3) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <span className="text-brass text-3xl">❧</span>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mt-4">
              Post Not Found
            </h1>
            <p className="font-body text-sm text-saddle mt-3">
              The article you are looking for does not exist in our archive.
            </p>
            <button
              onClick={() => navigate('/blog')}
              className="mt-6 font-display text-[11px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-6 py-2 hover:bg-brass hover:text-espresso transition-colors"
            >
              Back to Archive
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <article className="pt-8 pb-16 md:pb-24">
        {/* Hero */}
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => navigate('/blog')}
              className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle hover:text-brass transition-colors"
            >
              The Archive
            </button>
            <span className="w-3 h-3 flex items-center justify-center text-saddle/40">
              <i className="ri-arrow-right-s-line text-xs" />
            </span>
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-brass">
              Article
            </span>
          </div>

          {/* Title & Meta */}
          <div className="max-w-3xl mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[10px] tracking-wider uppercase text-brass border border-brass/30 px-2 py-1">
                {post.category}
              </span>
              <span className="w-1 h-1 rounded-full bg-brass/40" />
              <span className="font-mono text-[10px] tracking-wider uppercase text-saddle">
                {post.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-brass/40" />
              <span className="font-mono text-[10px] tracking-wider uppercase text-saddle">
                {post.readTime}
              </span>
            </div>

            <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase text-espresso leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brass/20 flex items-center justify-center">
                <span className="font-display text-[10px] text-brass">
                  {post.author.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <span className="font-body text-sm text-saddle">{post.author}</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-[21/9] overflow-hidden mb-12">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <MarkdownContent content={post.content} />

              {/* Tags */}
              <div className="mt-10 pt-6 border-t border-brass/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-4 h-4 flex items-center justify-center text-saddle/60">
                    <i className="ri-price-tag-3-line text-xs" />
                  </span>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-saddle/60">
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] tracking-wider uppercase text-saddle border border-brass/20 px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Share */}
                <div className="brass-double-border p-5 bg-cream/30">
                  <h4 className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso mb-3">
                    Share This Article
                  </h4>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center border border-brass/30 text-saddle hover:text-brass hover:border-brass transition-colors">
                      <i className="ri-twitter-x-line text-xs" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center border border-brass/30 text-saddle hover:text-brass hover:border-brass transition-colors">
                      <i className="ri-facebook-line text-xs" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center border border-brass/30 text-saddle hover:text-brass hover:border-brass transition-colors">
                      <i className="ri-linkedin-line text-xs" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center border border-brass/30 text-saddle hover:text-brass hover:border-brass transition-colors">
                      <i className="ri-link text-xs" />
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="brass-double-border p-5 bg-cream/30">
                  <h4 className="font-display text-[10px] tracking-[0.2em] uppercase text-espresso mb-2">
                    Research-Grade Peptides
                  </h4>
                  <p className="font-body text-sm text-saddle leading-relaxed mb-4">
                    Every batch is HPLC and MS verified with full COA transparency.
                  </p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="w-full font-display text-[10px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-4 py-2 hover:bg-brass hover:text-espresso transition-colors"
                  >
                    Browse the Collection
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 border-t border-brass/20 parchment-grain">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
              <span className="text-brass text-lg">❧</span>
              <h2 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mt-3">
                Related Articles
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {relatedPosts.map((related) => (
                <article
                  key={related.id}
                  onClick={() => navigate(`/blog/${related.id}`)}
                  className="group cursor-pointer brass-double-border bg-cream/30 hover:bg-cream/60 transition-colors duration-500"
                >
                  <div className="relative aspect-[16/10] overflow-hidden m-[4px]">
                    <img
                      src={related.imageUrl}
                      alt={related.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 to-transparent" />
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[10px] tracking-wider uppercase text-brass">
                        {related.date}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-brass/40" />
                      <span className="font-mono text-[10px] tracking-wider uppercase text-saddle">
                        {related.category}
                      </span>
                    </div>

                    <h3 className="font-display text-sm tracking-wider uppercase text-espresso mb-3 group-hover:text-brass-dark transition-colors leading-snug">
                      {related.title}
                    </h3>

                    <p className="font-body text-sm text-saddle leading-relaxed mb-4">
                      {related.excerpt}
                    </p>

                    <span className="flex items-center gap-1.5 text-brass group-hover:text-brass-light transition-colors">
                      <span className="font-display text-[10px] tracking-[0.15em] uppercase">
                        Read More
                      </span>
                      <span className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-arrow-right-line text-xs" />
                      </span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
}