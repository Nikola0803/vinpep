import { useNavigate } from 'react-router-dom';
import { blogPosts } from '../../../mocks/blog';

export default function BlogSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 parchment-grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-brass text-lg">❧</span>
          <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-espresso mt-3">
            The Archive
          </h2>
          <p className="font-body text-sm italic text-saddle mt-3 max-w-xl mx-auto">
            Research findings, testing methodologies, and peptide science from our laboratory notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => navigate(`/blog/${post.id}`)}
              className="group cursor-pointer brass-double-border bg-cream/30 hover:bg-cream/60 transition-colors duration-500"
            >
              <div className="relative aspect-[16/10] overflow-hidden m-[4px]">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 to-transparent" />
              </div>

              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-brass">
                    {post.date}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-brass/40" />
                  <span className="font-mono text-[10px] tracking-wider uppercase text-saddle">
                    {post.category}
                  </span>
                </div>

                <h3 className="font-display text-sm tracking-wider uppercase text-espresso mb-3 group-hover:text-brass-dark transition-colors leading-snug">
                  {post.title}
                </h3>

                <p className="font-body text-sm text-saddle leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-saddle/60">
                    {post.readTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-brass group-hover:text-brass-light transition-colors">
                    <span className="font-display text-[10px] tracking-[0.15em] uppercase">
                      Read More
                    </span>
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-arrow-right-line text-xs" />
                    </span>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/blog')}
            className="font-display text-[11px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-8 py-2.5 hover:bg-brass hover:text-espresso transition-colors"
          >
            View All Articles
          </button>
        </div>
      </div>
    </section>
  );
}