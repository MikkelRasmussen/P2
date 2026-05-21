import { translateCategory } from "../../utils/translations.js";

export default function SavedList({ liked, onRemove, onOpenDetail, onStartSwiping }) {
  if (liked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 text-center px-8">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <span className="text-4xl">❤️</span>
        </div>
        <h3 className="text-gray-900 text-2xl font-bold mb-2">
          Ingen gemte opskrifter
        </h3>
        <p className="text-gray-400 text-sm mb-7 max-w-[220px]">
          Swipe til højre på opskrifter du elsker for at gemme dem her!
        </p>
        <button
          onClick={onStartSwiping}
          className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full text-sm transition-all shadow-lg shadow-gray-900/20 active:scale-95"
        >
          Start med at swipe
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 w-full max-w-sm px-2">
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
          {liked.length} gemt{liked.length !== 1 ? "e" : ""} opskrift{liked.length !== 1 ? "er" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {liked.map((recipe) => (
          <div
            key={recipe.id}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all border border-gray-100 cursor-pointer active:scale-[0.98] shadow-sm"
            onClick={() => onOpenDetail?.(recipe)}
          >
            <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-gray-100">
              {recipe.imageurl ? (
                <img
                  src={recipe.imageurl}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                  🍽️
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-gray-900 text-base font-bold leading-tight truncate">
                {recipe.name || "Uden titel"}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-gray-400 text-[11px] font-medium flex-wrap">
                {recipe.category && <span>{translateCategory(recipe.category)}</span>}
                {recipe.price != null && (
                  <span className="text-green-700 font-semibold">
                    ca. {Math.round(recipe.price)} kr
                  </span>
                )}
                {recipe.pricedPercent != null && (
                  <span>{Math.round(recipe.pricedPercent * 100)}% prissat</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-gray-300 text-xs mr-1">›</span>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(recipe.id);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all text-xl leading-none"
                  aria-label="Fjern opskrift"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
