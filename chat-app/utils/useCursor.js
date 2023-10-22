import { useEffect } from "react";

const useCursor = (setCursorPosition, parentRef, space, selfConnectionId) => {
  let handleSelfCursorMove = () => {};
  useEffect(() => {
    if (!space || !selfConnectionId) return;
    const container = document.querySelector("#live-cursors");

    const handleSelfCursorMove = (e) => {
      if (!document.hasFocus()) return;

      const liveCursorsDiv = parentRef.current;
      const bounds = liveCursorsDiv?.getBoundingClientRect();
      if (!bounds) return;
      let relativeLeftPosition = e.clientX - bounds.left;
      let relativeTopPosition = e.clientY - bounds.top;
      if (e.clientX < bounds.left) relativeLeftPosition = -100;
      if (e.clientX > bounds.right) relativeLeftPosition = bounds.right;
      if (e.clientY < bounds.top) relativeTopPosition = -100;
      if (e.clientY > bounds.bottom) relativeTopPosition = bounds.bottom;


      setCursorPosition({
        left: relativeLeftPosition,
        top: relativeTopPosition,
        state: "move",
      });

      space.cursors.set({
        position: { x: relativeLeftPosition, y: relativeTopPosition },
        data: { state: "move" },
      });
    };

    const handleSelfCursorLeave = (e) => {
      setCursorPosition({
        left: 0,
        top: 0,
        state: "leave",
      });

      space.cursors.set({
        position: { x: 0, y: 0 },
        data: { state: "leave" },
      });

      
    };

    container.addEventListener("mousemove", handleSelfCursorMove);
    container.addEventListener("mouseleave", handleSelfCursorLeave);

    return () => {
      container.removeEventListener("mousemove", handleSelfCursorMove);
      container.removeEventListener("mouseleave", handleSelfCursorLeave);
    };
  }, [space, selfConnectionId]);

  return handleSelfCursorMove;
};

export default useCursor;
