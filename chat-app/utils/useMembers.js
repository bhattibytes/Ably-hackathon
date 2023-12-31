import { useState, useEffect } from "react";
import { SpaceMember, Space } from "@ably/spaces";

const useMembers = (space) => {
  const [otherMembers, setOtherMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [self, setSelf] = useState(null);

  useEffect(() => {
    if (!space) return;

    const setMembers = async () => {
      const others = await space.members.getOthers();
      setOtherMembers(others);
      const all = await space.members.getAll();
      setAllMembers(all);
      const s = await space.members.getSelf();
      setSelf(s);
    };

    /** 💡 Listen to space members entering and leaving 💡 */
    space.members.subscribe(setMembers);

    /** 💡 Set initial data */
    setMembers();

    return () => {
      /** 💡 Remove listener on unmount 💡 */
      space?.members.unsubscribe(setMembers);
    };
  }, [space]);

  return { self, otherMembers, allMembers };
};

export default useMembers;
