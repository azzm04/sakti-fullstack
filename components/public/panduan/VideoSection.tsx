'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBrandInstagram, IconPlayerPlay, IconExternalLink } from '@tabler/icons-react';

const REEL_SHORTCODE = 'DUSd_t2ESYK';
const REEL_URL = `https://www.instagram.com/reel/${REEL_SHORTCODE}/`;
const INSTAGRAM_HANDLE = '@kemdiktisaintek.ri';

export default function VideoSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setShowFallback(true);
  };

  return (
    <section className="py-24 px-8 bg-surface" id="tutorial">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-pink-100">
            <IconBrandInstagram className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-bold text-pink-600 tracking-wide">
              {INSTAGRAM_HANDLE}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-primary font-headline tracking-tight">
            Tutorial Pendaftaran KIP-Kuliah
          </h2>
          
          <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Tonton panduan visual lengkap yang memandu Anda melalui seluruh proses portal pendaftaran online.
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          {!showFallback ? (
            <div className="mx-auto max-w-[400px] relative">
              {/* Loading Skeleton */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-surface-container-low rounded-3xl overflow-hidden"
                    style={{ paddingBottom: '177.78%' }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-on-surface-variant font-medium">
                        Memuat video...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instagram Embed - Clean Version */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-surface-container-high">
                <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
                  <iframe
                    src={`https://www.instagram.com/reel/${REEL_SHORTCODE}/embed/`}
                    className="absolute inset-0 w-full h-full border-0"
                    frameBorder="0"
                    scrolling="no"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    title="Tutorial Pendaftaran KIP-Kuliah - Instagram Reel"
                  />
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-pink-500/10 to-primary/10 rounded-full blur-3xl -z-10"></div>
            </div>
          ) : (
            // Fallback UI jika iframe gagal load
            <div className="mx-auto max-w-[400px]">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-surface-container-high">
                <div className="relative w-full aspect-[9/16] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                    <IconPlayerPlay className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 font-headline">
                    Tutorial KIP-Kuliah 2026
                  </h3>
                  
                  <p className="text-sm text-white/70 mb-6 max-w-xs">
                    Video tidak dapat dimuat. Klik tombol di bawah untuk menonton langsung di Instagram.
                  </p>
                  
                  <a
                    href={REEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-pink-500/50 transition-all active:scale-95"
                  >
                    <IconBrandInstagram className="w-5 h-5" />
                    Tonton di Instagram
                    <IconExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href={REEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-lowest border-2 border-outline-variant/30 text-primary font-semibold rounded-xl hover:bg-surface-container-high hover:border-primary/30 transition-all active:scale-95 group"
          >
            <IconExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Buka di Instagram
          </a>
            
          <a
            href="https://www.instagram.com/kemdiktisaintek.ri/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <IconBrandInstagram className="w-4 h-4" />
            Ikuti {INSTAGRAM_HANDLE}
          </a>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-xl">
                    info
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-bold text-blue-900 font-headline">
                  Sumber Terpercaya
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Video tutorial ini berasal langsung dari akun resmi Kementerian Pendidikan Tinggi, 
                  Sains, dan Teknologi Republik Indonesia. Informasi yang disampaikan telah terverifikasi 
                  dan sesuai dengan regulasi terbaru KIP-Kuliah 2026.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}