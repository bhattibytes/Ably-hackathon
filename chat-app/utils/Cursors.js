import React, { useEffect, useState } from "react";
import CursorSvg from "./cursorSVG";
import useCursor from "./useCursor";

// 💡 This component is used to render the cursor of the user
const YourCursor = ({ self, space, parentRef }) => {
  const [cursorPosition, setCursorPosition] = useState({
    left: 50,
    top: 50,
    state: "move",
  });

  const handleSelfCursorMove = useCursor(
    setCursorPosition,
    parentRef,
    space,
    self?.connectionId
  );

  if (!self) {
    return null;
  }

  if (cursorPosition.state === "leave") return null;

  const { cursorColor, nameColor } = self.profileData.userColors;
  

  return (
    
    <div
      className="moving"
      onMouseMove={(e) => handleSelfCursorMove(e)}
      style={{
        left: `${cursorPosition.left}px`,
        top: `${cursorPosition.top}px`,
      }}
    >
      <CursorSvg cursorColor={cursorColor} />
      <div
        
        style={{ backgroundColor: cursorColor, padding: "8px 16px", borderRadius: "20px", color: "white", whiteSpace: "nowrap", margin:"8px"}}
      >
        You
      </div>
    </div>
  );
};

// 💡 This component is used to render the cursors of other users in the space
const MemberCursors = ({ otherUsers, space, selfConnectionId }) => {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!space) return;

    space.cursors.subscribe("update", (event) => {
      let e = event;
      // 💡 Ignore our own cursor
      if (e.connectionId === selfConnectionId) return;

      setPositions((positions) => ({
        ...positions,
        [e.connectionId]: {
          position: e.position,
          state: e.data.state,
        },
      }));
    });

    return () => {
      space.cursors.unsubscribe();
    };
  }, [space]);

  return (
    <>
      {otherUsers.map(({ connectionId, profileData }) => {
        if (!positions[connectionId]) return;
        if (positions[connectionId].state === "leave") return;

        const { cursorColor, nameColor } = profileData.userColors;

        return (
          <div
            key={connectionId}
            id={`member-cursor-${connectionId}`}
            className="moving"
            style={{
              left: `${positions[connectionId].position.x}px`,
              top: `${positions[connectionId].position.y}px`,
            }}
          >
            <CursorSvg cursorColor={cursorColor} />
            <div
              style={{ backgroundColor: cursorColor, padding: "8px 16px", borderRadius: "20px", color: "white", whiteSpace: "nowrap", margin:"8px"}}
            >
              {profileData.name}
            </div>
          </div>
        );
      })}
    </>
  );
};

export { MemberCursors, YourCursor };
