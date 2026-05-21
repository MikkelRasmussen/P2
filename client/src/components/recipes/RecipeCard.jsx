import { useRef, useState, useCallback } from "react";
import { translateCategory } from "../../utils/translations.js";

const SWIPE_THRESHOLD = 90;
const DRAG_THRESHOLD = 6;

function buildDescription(recipe, ingredients) {
  if (recipe?.instructions) {
    const first = String(recipe.instructions)
      .split(/\r?\n/)
      .map((s) => s.replace(/step\s*\d+/gi, "").trim())
      .find(Boolean);
    if (first && first.length > 20) {
      return first.length > 120 ? `${first.slice(0, 117)}...` : first;
    }
  }

  if (ingredients.length > 0) {
    const names = ingredients
      .slice(0, 4)
      .map((i) => i?.ingredient)
      .filter(Boolean);
    if (names.length > 0) {
      return `Lavet med ${names.join(", ")}${names.length < ingredients.length ? " og mere" : ""}.`;
    }
  }

  return "Tryk for at se ingredienser og fremgangsmåde.";
}

function buildTags(recipe) {
  const tags = [];
  if (recipe?.category) {
    tags.push(translateCategory(recipe.category));
  }
  if (recipe?.price != null) {
    tags.push(`ca. ${Math.round(recipe.price)} kr`);
  }
  if (recipe?.pricedPercent != null && tags.length < 2) {
    tags.push(`${Math.round(recipe.pricedPercent * 100)}% prissat`);
  }
  return tags.slice(0, 2);
}

export default function RecipeCard({ recipe, onSwipe, onOpenDetail, isTop, stackStyle }) {
  const cardRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startY: 0, moved: false, dx: 0, dy: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const likeOpacity = Math.max(0, Math.min(pos.x / 65, 1));
  const nopeOpacity = Math.max(0, Math.min(-pos.x / 65, 1));
  const rotation = pos.x / 22;

  const onPointerDown = useCallback(
    (e) => {
      if (!isTop) return;
      e.preventDefault();
      drag.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        dx: 0,
        dy: 0,
      };
      cardRef.current?.setPointerCapture(e.pointerId);
    },
    [isTop]
  );

  const onPointerMove = useCallback((e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (
      !drag.current.moved &&
      (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
    ) {
      drag.current.moved = true;
      setDragging(true);
    }
    if (drag.current.moved) {
      drag.current.dx = dx;
      drag.current.dy = dy;
      setPos({ x: dx, y: dy });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (!drag.current.active) return;
    const wasDrag = drag.current.moved;
    const finalX = drag.current.dx;
    drag.current.active = false;
    drag.current.moved = false;
    setDragging(false);

    if (!wasDrag) {
      onOpenDetail();
    } else if (finalX > SWIPE_THRESHOLD) {
      onSwipe("like");
    } else if (finalX < -SWIPE_THRESHOLD) {
      onSwipe("nope");
    } else {
      setPos({ x: 0, y: 0 });
    }
  }, [onSwipe, onOpenDetail]);

  const ingredients = recipe?.ingredients || [];
  const categoryLabel = recipe?.category
    ? translateCategory(recipe.category).toUpperCase()
    : "OPSKRIFT";
  const tags = buildTags(recipe);
  const description = buildDescription(recipe, ingredients);

  const topTransform = `translateX(${pos.x}px) translateY(${pos.y}px) rotate(${rotation}deg)`;

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 flex flex-col rounded-[2rem] overflow-hidden bg-white shadow-2xl touch-none select-none"
      style={{
        transform: isTop ? topTransform : stackStyle?.transform || "none",
        transition: dragging
          ? "none"
          : "transform 0.35s cubic-bezier(0.175,0.885,0.32,1.1)",
        cursor: dragging ? "grabbing" : isTop ? "grab" : "default",
        zIndex: stackStyle?.zIndex || 0,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Image + category badge */}
      <div className="relative h-[52%] min-h-[200px] w-full shrink-0 bg-gray-100">
        {recipe?.imageurl ? (
          <img
            src={recipe.imageurl}
            alt={recipe.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Intet billede
          </div>
        )}

        {recipe?.category && (
          <span className="absolute top-4 left-4 z-10 bg-lime-400 text-slate-900 text-[11px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
            {categoryLabel}
          </span>
        )}

        {isTop && (
          <>
            <div
              className="absolute top-5 right-5 z-20 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md"
              style={{ opacity: likeOpacity, transform: "rotate(-12deg)" }}
            >
              MUMS
            </div>
            <div
              className="absolute top-14 right-5 z-20 bg-slate-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md"
              style={{ opacity: nopeOpacity, transform: "rotate(12deg)" }}
            >
              NEJ
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6 gap-3 min-h-0">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          {recipe?.name || "Uden titel"}
        </h2>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
          {description}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-auto pt-1 w-fit"
        >
          <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            i
          </span>
          <span>Klik for at læse mere</span>
        </button>
      </div>
    </div>
  );
}
