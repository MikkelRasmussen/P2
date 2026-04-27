import { useRef, useState, useCallback } from "react";

const SWIPE_THRESHOLD = 90;
const DRAG_THRESHOLD = 6;

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

  const topTransform = `translateX(${pos.x}px) translateY(${pos.y}px) rotate(${rotation}deg)`;

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 rounded-3xl overflow-hidden shadow-lg select-none touch-none bg-white"
      style={{
        transform: isTop ? topTransform : stackStyle.transform,
        transition: dragging
          ? "none"
          : "transform 0.35s cubic-bezier(0.175,0.885,0.32,1.1)",
        cursor: dragging ? "grabbing" : isTop ? "grab" : "default",
        zIndex: stackStyle.zIndex,
        willChange: "transform",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Image area with gradient overlay */}
      <div className="absolute inset-0">
        {/* Gradient background as image placeholder */}
        <div className="absolute inset-0 translate-y-4 scale-95 bg-surface-container-low rounded-lg -z-10"></div>
        <div className="absolute inset-0 translate-y-2 scale-[0.975] bg-surface-container rounded-lg -z-10"></div>


      </div>
      <article className="bg-surface-container-lowest rounded-lg shadow-[0_12px_40px_rgba(44,47,46,0.06)] overflow-hidden">
        <div className="relative h-[320px] w-full p-4">
          <img alt="Artisanal Salad" className="w-full h-full object-cover rounded-lg" data-alt="Close-up of a vibrant Mediterranean Buddha bowl with roasted chickpeas, fresh kale, radishes, and creamy tahini dressing in soft morning light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpq0vA8zMMd67ak4pKq6uO_jS52Kow1JVWUvsqMI1lW0M58w-dbRtTjxSgP2UOS0VqSea7f0d3RZKjktbvPJ5Gxsvb5XhTxGZfLk4iY8PzeTkrexVCkG55av5ELWx4lzZ5QdYYQYQK1EbiRLwkZHnjm46hfm0Mw88bLnvJ7wFB0Asf4AoW-M1fb3krR2o-ubtdH1bv9sAhDYuWT2E0uyCA1wsQP-t5fyJ3T0J60uvery1B8C4X1rYiKj-grnGSzJhR0SniyIHCQ0O7" />
          {/* Quick Filter Chips */}
          <div className="absolute top-8 left-8 flex gap-2">
            {recipe.tags[0] && (
              <span className="bg-primary-container/90 backdrop-blur-sm text-on-primary-container px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase font-label">{recipe.tags[0]}</span>)}

          </div>
        </div>



        {/* Top badges row */}


        {/* YUM! stamp - modern style */}
        {
          isTop && (
            <div
              className="absolute top-24 left-6 bg-green-500 text-white px-5 py-2 rounded-full pointer-events-none shadow-lg"
              style={{
                opacity: likeOpacity,
                transform: "rotate(-22deg)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "1.25rem",
                fontWeight: "800",
                letterSpacing: "0.05em",
                transition: "opacity 0.04s linear",
              }}
            >
              YUM!
            </div>
          )
        }

        {/* NOPE stamp - modern style */}
        {
          isTop && (
            <div
              className="absolute top-24 right-6 bg-gray-400 text-white px-5 py-2 rounded-full pointer-events-none shadow-lg"
              style={{
                opacity: nopeOpacity,
                transform: "rotate(22deg)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "1.25rem",
                fontWeight: "800",
                letterSpacing: "0.05em",
                transition: "opacity 0.04s linear",
              }}
            >
              NOPE
            </div>
          )
        }

        {/* Bottom content card */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Gradient fade from image to card */}


          {/* White content card */}

          <div className="relative bg-white rounded-t-3xl px-5 pt-6 pb-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2
                className="text-gray-900 leading-tight flex-1"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  lineHeight: "1.2",
                }}
              >
                {recipe.name}
              </h2>
              <span className="text-3xl flex-shrink-0">{recipe.emoji}</span>
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {recipe.tags.slice(1).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-gray-500 text-[13px] leading-relaxed mb-3 line-clamp-2">
              {recipe.description}
            </p>

            {/* Stats row */}
            <div className="flex text-xs text-gray-400 font-medium">
              <button className=" text-primary hover:bg-primary-container p-2 rounded-full transition-colors">
                <span className="material-symbols-outlined" data-icon="info">info</span>

              </button>
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Click to read more</span>
              </span>


            </div>
          </div>
        </div>
      </article>
    </div >
  );
}