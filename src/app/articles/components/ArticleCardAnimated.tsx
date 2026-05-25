"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  author: string | null;
  readingTime: number | null;
  publishedAt: string | null;
  createdAt: string;
  tags: string[];
  formattedDate: string;
}

interface Props {
  article: Article;
  index: number;
}

export default function ArticleCardAnimated({ article, index }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4), ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:ring-rose-200"
    >
      <Link href={`/articles/${article.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-2xl text-rose-300">
              {article.title.slice(0, 1)}
            </div>
          )}
          {article.category && (
            <div className="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 shadow-sm">
              {article.category}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{article.formattedDate}</span>
            {article.readingTime ? (
              <>
                <span>·</span>
                <span>อ่าน {article.readingTime} นาที</span>
              </>
            ) : null}
          </div>

          <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-gray-900 transition-colors group-hover:text-rose-600 line-clamp-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-3">
              {article.excerpt}
            </p>
          )}

          <div className="mt-auto pt-5 flex items-center justify-between">
            {article.author ? (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-[11px] font-bold text-white">
                  {article.author.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {article.author}
                </span>
              </div>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition-all group-hover:gap-2">
              อ่านต่อ
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14m0 0-6-6m6 6-6 6"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
