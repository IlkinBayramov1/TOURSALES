import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Share2, 
  Check, 
  BookOpen 
} from 'lucide-react';
import { Spinner, Badge, Button } from '@toursales/ui';
import { cmsApi, BlogPost } from '../../api/cmsApi';
import './BlogDetailPage.css';

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await cmsApi.getBlogPostBySlug(slug);
        setPost(res.data);
      } catch (err) {
        console.error('Məqalə tapılmadı:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
      } catch (err) {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="web-blog-detail-loading">
        <Spinner size="lg" />
        <p>Məqalə yüklənir...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="web-blog-detail-error">
        <h2>Məqalə Tapılmadı</h2>
        <Link to="/blog">
          <Button variant="primary">Bloqa Qayıt</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="web-blog-detail-page">
      <div className="web-blog-detail-container">
        <div className="web-blog-detail-nav">
          <Link to="/blog" className="web-back-to-blogs">
            <ArrowLeft size={16} />
            <span>Bütün Məqalələrə Qayıt</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="web-share-article-btn"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copied ? 'Link Kopyalandı' : 'Paylaş'}</span>
          </Button>
        </div>

        <header className="web-blog-article-header">
          <div className="web-blog-tags">
            {post.tags.map((tag, i) => (
              <Badge key={i} variant="primary" pill>
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="web-blog-article-title">{post.title}</h1>

          <div className="web-blog-author-meta">
            <div className="web-author-info">
              <User size={16} />
              <span>{post.author}</span>
            </div>
            <span>•</span>
            <div className="web-post-date">
              <Calendar size={16} />
              <span>
                {new Date(post.createdAt).toLocaleDateString('az-AZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span>•</span>
            <div className="web-post-time">
              <Clock size={16} />
              <span>{post.readTimeMinutes} dəqiqəlik mütaliə</span>
            </div>
          </div>
        </header>

        <div className="web-blog-cover-banner">
          <img src={post.coverImage} alt={post.title} />
        </div>

        <div
          className="web-blog-content-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="web-blog-footer-box">
          <div className="web-footer-left">
            <h4>Faydalı oldu? Dostlarınızla paylaşın:</h4>
            <div className="web-share-pills">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 size={14} /> Linki Kopyala
              </Button>
            </div>
          </div>

          <Link to="/catalog">
            <Button variant="primary" size="md">
              <span>Turları Kəşf Edin</span>
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
};
