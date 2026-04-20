export default function PanduanSection() {
  return (
    <section
      id="panduan"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Tutorial dan Informasi
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Berikut adalah panduan visual resmi dari Kementerian untuk melakukan
            pendaftaran KIPK.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#F8FAFC] p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-center text-primary mb-4">
              Video Tutorial Pendaftaran
            </h3>
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              >
                <source
                  src="https://cpljziscjujobhvlutcw.supabase.co/storage/v1/object/sign/Videos/Tutorial-Daftar-KIPK.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83MTljYWI2OC0yZDkwLTRlMmYtYWNiOS03MDc1MTJiZWEwNGYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJWaWRlb3MvVHV0b3JpYWwtRGFmdGFyLUtJUEsubXA0IiwiaWF0IjoxNzc2NjYzNzQ2LCJleHAiOjE4NzEyNzE3NDZ9.BiqTvhvBWhTmcpUpji13Nalca5LpghKZAgDvROV4FZc"
                  type="video/mp4"
                />
                Maaf, browser Anda tidak mendukung pemutar video HTML5.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}