import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { Spinner, Input } from '@toursales/ui';
import { cmsApi, BlogPost } from '../../api/cmsApi';
import { BlogCard } from '../../components/BlogCard/BlogCard';
import './BlogListPage.css';

export const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await cmsApi.getBlogPosts();
        setPosts(res.data || []);
      } catch (err) {
        console.error('Bloqlar yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const allTags = ['ALL', ...Array.from(new Set(posts.flatMap((p) => p.tags)))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.summary.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="web-blog-list-page">
      <div className="web-blog-hero">
        <div className="web-blog-hero-badge">
          <BookOpen size={16} />
          <span>TOURSALES JURNALI</span>
        </div>
        <h1>Səyahət Bələdçisi və Təcrübələr</h1>
        <p>
          Qarabağın tarixi məkanları, Azərbaycanın füsunkar təbiəti və xarici turlar haqqında maraqlı bələdçilər.
        </p>

        <div className="web-blog-search-bar">
          <Input
            placeholder="Məqalələrdə axtarış edin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="web-blog-container">
        <div className="web-blog-tags-row">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`web-blog-tag-btn ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag === 'ALL' ? 'Bütün Məqalələr' : `#${tag}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="web-blog-loading">
            <Spinner size="lg" />
            <p>Məqalələr hazırlanır...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="web-blog-empty">
            <h3>Heç bir məqalə tapılmadı</h3>
            <p>Axtarış sözünü dəyişərək yenidən yoxlayın.</p>
          </div>
        ) : (
          <div className="web-blog-grid">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
