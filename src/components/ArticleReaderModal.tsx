import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { Article } from '../data/articles';

interface ArticleReaderModalProps {
  article: Article | null;
  onClose: () => void;
}

export default function ArticleReaderModal({ article, onClose }: ArticleReaderModalProps) {
  return (
    <AnimatePresence>
      {article && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Banner / Header Image */}
            <div className="h-48 md:h-56 relative overflow-hidden shrink-0">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {article.category}
                </span>
                <h2 className="text-base md:text-lg font-bold text-slate-100 mt-2 tracking-tight leading-snug">
                  {article.title}
                </h2>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 text-xs text-slate-300 leading-relaxed scrollbar-thin">
              <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono pb-4 border-b border-slate-850">
                <span>Tác giả: <strong>{article.author}</strong></span>
                <span>•</span>
                <span>{article.time}</span>
              </div>

              <div className="text-slate-200 font-medium text-[12px] bg-slate-950/40 p-4 rounded-2xl border border-slate-850/60 leading-relaxed italic">
                "{article.summary}"
              </div>

              {/* Article Body Content */}
              <div className="space-y-4 pt-2 whitespace-pre-wrap text-slate-300">
                {article.content.split('\n\n').map((paragraph, index) => {
                  if (
                    paragraph.startsWith('Quy trình') ||
                    paragraph.startsWith('Liên kết') ||
                    paragraph.startsWith('Triệt tiêu') ||
                    paragraph.startsWith('Sự khác biệt') ||
                    paragraph.startsWith('Tại sao')
                  ) {
                    return (
                      <h4 key={index} className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono pt-2">
                        {paragraph}
                      </h4>
                    );
                  }
                  if (paragraph.match(/^\d\./) || paragraph.startsWith('- ')) {
                    return (
                      <div key={index} className="bg-slate-950/20 border-l-2 border-emerald-500/40 pl-3.5 py-1 my-2 text-slate-300 font-mono">
                        {paragraph}
                      </div>
                    );
                  }
                  return (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 border-t border-slate-850 p-4 px-6 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Nguồn: Ban Bảo Mật SecureCrypt</span>
              </span>
              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl transition-all"
              >
                ĐÃ HIỂU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
