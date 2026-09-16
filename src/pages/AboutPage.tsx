import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { FadeUp, ImageReveal, StaggerContainer, StaggerItem } from '../components/motion/MotionPrimitives'

export function AboutPage() {
  return (
    <main className="flex-1 bg-(--bg-primary) text-(--text-primary)">
      
      {/* ─── Hero / Header ─── */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-(--bg-surface-secondary) border-b border-(--border-theme)">
        <div className="container-max max-w-4xl mx-auto text-center space-y-4">
          <FadeUp delay={100}>
            <span className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
              About Us
            </span>
          </FadeUp>
          
          <FadeUp delay={200}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-(--text-primary)">
              Our Story & Craft
            </h1>
          </FadeUp>

          <FadeUp delay={300}>
            <p className="text-xs sm:text-sm md:text-base text-(--text-secondary) max-w-2xl mx-auto">
              Learn more about [CAFÉ NAME], our passion for great coffee, and our dedication to quality.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ─── Café Story Section ─── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="container-max max-w-4xl mx-auto space-y-12">
          
          <div className="bg-(--bg-surface) border border-(--border-theme) rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs space-y-8">
            {/* Editorial Craft Image Reveal */}
            <ImageReveal
              src="/assets/hero.jpg"
              alt="Café craft ambience"
              aspectRatio="aspect-16/9"
              className="border border-(--border-theme) shadow-sm"
            />

            <div className="space-y-4">
              <FadeUp delay={100} className="flex items-center gap-3 text-(--accent-green)">
                <Icon name="history_edu" size={28} />
                <h2 className="text-2xl font-bold text-(--text-primary)">Café Story</h2>
              </FadeUp>

              <FadeUp delay={200} className="space-y-4 text-xs sm:text-sm md:text-base text-(--text-secondary) leading-relaxed">
                <p>[CLIENT STORY - Detailed narrative detailing how the café was founded, its culinary background, and its passion for creating an inviting gathering place.]</p>
                <p>[CLIENT STORY CONTINUATION - Information regarding local sourcing, artisan roasting techniques, and community focus.]</p>
              </FadeUp>
            </div>
          </div>

          {/* ─── Café Beliefs & Values ─── */}
          <div className="space-y-6">
            <FadeUp className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
                What Guides Us
              </span>
              <h2 className="text-2xl font-bold text-(--text-primary)">
                Our Beliefs & Values
              </h2>
            </FadeUp>

            <StaggerContainer interval={90} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <StaggerItem index={0}>
                <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-3 hover:border-(--accent-green) hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <div className="w-10 h-10 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center font-bold">
                    <Icon name="eco" size={24} />
                  </div>
                  <h3 className="font-bold text-base text-(--text-primary)">[VALUE 1 NAME]</h3>
                  <p className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                    [CLIENT VALUE 1 - Details about quality ingredients, freshness, and culinary standards.]
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem index={1}>
                <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-3 hover:border-(--accent-green) hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <div className="w-10 h-10 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center font-bold">
                    <Icon name="favorite" size={24} />
                  </div>
                  <h3 className="font-bold text-base text-(--text-primary)">[VALUE 2 NAME]</h3>
                  <p className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                    [CLIENT VALUE 2 - Details regarding warm hospitality, friendly atmosphere, and guest comfort.]
                  </p>
                </div>
              </StaggerItem>

              <StaggerItem index={2}>
                <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-3 hover:border-(--accent-green) hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <div className="w-10 h-10 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center font-bold">
                    <Icon name="groups" size={24} />
                  </div>
                  <h3 className="font-bold text-base text-(--text-primary)">[VALUE 3 NAME]</h3>
                  <p className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                    [CLIENT VALUE 3 - Details regarding community, connection, and creating a welcoming gathering hub.]
                  </p>
                </div>
              </StaggerItem>

            </StaggerContainer>
          </div>

          {/* ─── Back to Menu CTA ─── */}
          <FadeUp className="pt-6 text-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-(--accent-blue) text-white text-xs sm:text-sm font-semibold hover:bg-(--accent-blue-hover) transition-all duration-200 shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span>Explore Our Menu</span>
              <Icon name="arrow_forward" size={16} />
            </Link>
          </FadeUp>

        </div>
      </section>

    </main>
  )
}
