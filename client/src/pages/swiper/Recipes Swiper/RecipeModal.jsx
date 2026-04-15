export default function RecipeModal({ recipe, onClose, onSwipe, showActions }) {

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-sm rounded-t-3xl overflow-hidden"
        style={{ background: "#FFFFFF", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fixed inset-0 z-[60] bg-on-surface/30 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 overflow-hidden">
          {/* Recipe Popup Modal */}
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[921px] overflow-y-auto rounded-lg shadow-2xl relative flex flex-col md:flex-row scrollbar pr-4 overflow-y-auto">

            {/* Close Button (Floating) */}
            <button onClick={onClose} className="absolute top-6 right-6 z-[70] bg-surface-container-highest/80 backdrop-blur-md p-3 rounded-full hover:bg-surface-container-high transition-colors shadow-sm">
              <span className="material-symbols-outlined text-on-surface">
                close
              </span>
            </button>

            {/* Hero Image Section */}
            <div className="w-full md:w-1/2 h-64 md:h-auto sticky top-0 md:relative">
              <img
                alt="Heirloom Tomato and Burrata Salad"
                className="w-full h-full object-cover"
                data-alt="Close-up of a vibrant heirloom tomato and creamy burrata salad with fresh basil and olive oil drizzle, soft natural morning light"
                src={recipe.image}
              />
              <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.1)] pointer-events-none"></div>
            </div>
            {/* Content Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col gap-10">

              {/* Title & Meta */}
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface leading-tight tracking-tight mb-4">
                  {recipe.name}
                </h1>
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="font-label text-label-md uppercase tracking-widest text-on-surface-variant">
                      Prep Time
                    </span>
                    <span className="font-headline font-bold text-lg text-primary">
                      15 MIN
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label text-label-md uppercase tracking-widest text-on-surface-variant">
                      Servings
                    </span>
                    <span className="font-headline font-bold text-lg text-primary">
                      2-3
                    </span>
                  </div>
                </div>
              </div>
              {/* Ingredients List */}
              <section>
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">
                    shopping_basket
                  </span>
                  Ingredienser
                </h2>

                <ul className="space-y-4">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-4 group">
                      <span className="w-2 h-2 rounded-full bg-secondary-container group-hover:bg-secondary transition-colors"></span>
                      <span className="font-body text-on-surface-variant">
                        {ing}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              {/* Preparation Guide */}
              <section className="pb-8">
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    restaurant
                  </span>
                  The Preparation
                </h2>

                <div className="space-y-8">
                  {recipe.steps.map((step, i) => (
                    <div className="flex gap- 6 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center font-headline font-bold text-on-primary-container mr-4">
                        {i + 1}
                      </div>
                      <div className="pt-1">

                        <p className="font-body text-on-surface-variant leading-relaxed">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}