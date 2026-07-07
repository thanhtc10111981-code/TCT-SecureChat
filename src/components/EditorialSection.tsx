import React from 'react';
import { Newspaper, BookOpen } from 'lucide-react';
import { EditorialArticle } from '../types';

interface EditorialSectionProps {
  articles: EditorialArticle[];
  setSelectedArticle: (article: EditorialArticle) => void;
}

export default function EditorialSection({ articles, setSelectedArticle }: EditorialSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 mt-6 shadow-sm text-left">
      <div className="flex items-center justify-between pb-3 border-b-2 border-dantri-green">
        <div className="flex items-center space-x-2.5">
          <span className="w-3.5 h-6 bg-dantri-green inline-block rounded-xs" />
          <h2 className="text-base font-bold text-dantri-green uppercase tracking-wide font-sans">
            Thời Báo Sức Mạnh Số
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-sans hidden sm:inline">Chuyên mục bảo mật truyền thông & công nghệ</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article) => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-white hover:bg-slate-50/40 border border-slate-100 hover:border-slate-200 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col group h-full shadow-xs"
          >
            <div className="aspect-[16/10] overflow-hidden relative shrink-0 bg-slate-150">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-dantri-red text-[8px] font-bold text-white px-1.5 py-0.5 rounded-xs uppercase tracking-wider font-sans">
                {article.category}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1 space-y-2">
              <h3 className="font-serif text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-dantri-green transition-colors">
                {article.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">
                {article.summary}
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                <span>{article.time}</span>
                <span className="text-dantri-green font-bold flex items-center space-x-1 group-hover:text-dantri-red transition-colors">
                  <span>Xem chuyên đề</span>
                  <BookOpen className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
