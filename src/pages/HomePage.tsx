import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { MenuCard } from '../components/menu/MenuCard'
import { CAFÉ_MENU_ITEMS } from '../data/menuData'
import { FadeUp, FadeIn, StaggerContainer, StaggerItem, ImageReveal } from '../components/motion/MotionPrimitives'

export function HomePage() {
  // Popular items showcase (taking first 6 items across categories)
  const popularItems = CAFÉ_MENU_ITEMS.slice(0, 6)

  return (
    <main className="flex-1 bg-(--bg-primary) text-(--text-primary)">
      
      {/* ─── Hero Section ─── */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-(--bg-surface-secondary) to-(--bg-primary) border-b border-(--border-theme) overflow-hidden">
        {/* Background Image Container with Slow Scale & Mask Reveal */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden">
          <img
            src="/assets/hero.jpg"
            alt="Café atmosphere"
            className="w-full h-full object-cover scale-105 animate-[fadeIn_1.2s_ease-out_forwards]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-(--bg-surface-secondary)/80 via-transparent to-(--bg-primary)" />
        </div>

        <div className="relative z-10 container-max max-w-4xl mx-auto text-center space-y-6">
          
          {/* Eyebrow Badge */}
          <FadeUp delay={100} duration={600}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-(--bg-surface) border border-(--border-theme) text-xs font-semibold text-(--accent-green) shadow-xs">
              <Icon name="coffee" size={16} />
              <span>Welcome to [CAFÉ NAME]</span>
            </div>
          </FadeUp>

          {/* Main Heading */}
          <FadeUp delay={250} duration={700}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-(--text-primary) leading-tight">
              Artisan Coffee & Freshly Baked Delights
            </h1>
          </FadeUp>

          {/* Description */}
          <FadeUp delay={400} duration={700}>
            <p className="text-sm sm:text-base md:text-lg text-(--text-secondary) max-w-2xl mx-auto leading-relaxed">
              [WELCOME MESSAGE - A short welcoming café tagline highlighting fresh ingredients, rich coffee, and warm hospitality.]
            </p>
          </FadeUp>

          {/* CTA Buttons */}
          <FadeUp delay={550} duration={700}>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/menu"
                className="px-6 py-3 rounded-xl bg-(--accent-blue) text-white text-xs sm:text-sm font-semibold hover:bg-(--accent-blue-hover) transition-all duration-200 shadow-md hover:-translate-y-0.5 active:scale-[0.98] inline-flex items-center gap-2"
              >
                <span>Explore Our Menu</span>
                <Icon name="arrow_forward" size={16} />
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl bg-(--bg-surface) text-(--text-primary) text-xs sm:text-sm font-semibold border border-(--border-theme) hover:border-(--accent-green) hover:text-(--accent-green) transition-all duration-200 shadow-xs hover:-translate-y-0.5 active:scale-[0.98] inline-flex items-center gap-2"
              >
                <Icon name="location_on" size={16} />
                <span>Visit Us</span>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ─── Café Description & Editorial Section ─── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="container-max max-w-5xl mx-auto bg-(--bg-surface) border border-(--border-theme) rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs space-y-6 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Story Image with Premium Image Reveal */}
            <div className="md:col-span-5">
              <ImageReveal
                src="/assets/story.jpg"
                alt="Artisan coffee pour-over"
                aspectRatio="aspect-4/3"
                className="shadow-sm border border-(--border-theme)"
              />
            </div>

            {/* Text Story Narrative */}
            <div className="md:col-span-7 space-y-4">
              <FadeUp delay={100}>
                <span className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
                  About [CAFÉ NAME]
                </span>
              </FadeUp>

              <FadeUp delay={200}>
                <h2 className="text-2xl md:text-3xl font-bold text-(--text-primary)">
                  A Warm Space Built for Coffee & Community
                </h2>
              </FadeUp>

              <FadeUp delay={300}>
                <p className="text-xs md:text-sm text-(--text-secondary) leading-relaxed">
                  [CLIENT DESCRIPTION - Detailed overview of the café, its commitment to exceptional flavors, handcrafted pastries, and welcoming ambience.]
                </p>
              </FadeUp>

              <FadeUp delay={400}>
                <div className="pt-2">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-(--accent-green) hover:underline group"
                  >
                    <span>Read Our Full Story</span>
                    <Icon name="chevron_right" size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </FadeUp>
            </div>

          </div>

          {/* Hours Card */}
          <FadeIn delay={200} className="pt-4 border-t border-(--border-subtle)">
            <div className="bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-(--accent-green)/10 text-(--accent-green) flex items-center justify-center shrink-0">
                  <Icon name="storefront" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-(--text-primary)">Opening Hours</h3>
                  <p className="text-xs text-(--text-secondary)">[OPENING HOURS]</p>
                </div>
              </div>
              <div className="text-xs font-semibold text-(--accent-green) bg-(--bg-surface) px-3.5 py-1.5 rounded-lg border border-(--border-theme)">
                [ADDRESS]
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Popular Food & Drinks Section ─── */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-(--bg-surface-secondary)/50 border-t border-b border-(--border-theme)">
        <div className="container-max space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <FadeUp delay={100}>
              <span className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
                Guest Favorites
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-(--text-primary) mt-1">
                Popular Food & Drinks
              </h2>
            </FadeUp>
            
            <FadeUp delay={200}>
              <Link
                to="/menu"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-(--bg-surface) border border-(--border-theme) text-xs font-semibold text-(--text-primary) hover:border-(--accent-green) hover:text-(--accent-green) transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
              >
                <span>View Full Menu</span>
                <Icon name="arrow_forward" size={14} />
              </Link>
            </FadeUp>
          </div>

          {/* Staggered Items Grid */}
          <StaggerContainer interval={70} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularItems.map((item, index) => (
              <StaggerItem key={item.id} index={index}>
                <MenuCard item={item} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Visit CTA Section ─── */}
      <section className="py-16 md:py-24 px-4 md:px-6 text-center">
        <FadeUp duration={700} className="container-max max-w-3xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-full bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center mx-auto border border-(--border-theme) shadow-xs">
            <Icon name="local_cafe" size={32} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-(--text-primary)">
            Stop by for your daily cup or a relaxed meal
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-(--text-secondary) max-w-xl mx-auto">
            We look forward to welcoming you at [CAFÉ NAME].
          </p>

          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-(--accent-green) text-white text-xs sm:text-sm font-semibold hover:bg-(--accent-green-hover) transition-all duration-200 shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get Location & Contact Info
            </Link>
          </div>
        </FadeUp>
      </section>

    </main>
  )
}
