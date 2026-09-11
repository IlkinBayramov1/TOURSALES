import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { Card, Badge } from '@toursales/ui';
import { BlogPost } from '../../api/cmsApi';
import './BlogCard.css';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <Card variant="default" className="web-blog-card">
      <Link to={`/blog/${post.slug}`} className="web-blog-card-link">
        <div className="web-blog-cover-wrap">
          <img src={post.coverImage} alt={post.title} className="web-blog-cover-img" />
          <div className="web-blog-tags-floating">
            {post.tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="primary" pill>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="web-blog-card-body">
          <div className="web-blog-meta">
            <span className="web-blog-meta-item">
              <Calendar size={13} />
              {new Date(post.createdAt).toLocaleDateString('az-AZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="web-blog-meta-item">
              <Clock size={13} />
              {post.readTimeMinutes} dəq oxu
            </span>
          </div>

          <h3 className="web-blog-title">{post.title}</h3>
          <p className="web-blog-summary">{post.summary}</p>

          <div className="web-blog-footer">
            <span className="web-blog-author">
              <User size={14} />
              {post.author}
            </span>
            <span className="web-blog-read-more">
              <span>Ətraflı Oxu</span>
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
};
