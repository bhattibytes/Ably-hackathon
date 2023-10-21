import KanbanHome from "../../components/KanbanHome";
import { SpaceContextProvider } from "../../utils/SpacesContext";

const Home = () => {
  return (
    <div>
      <SpaceContextProvider>
      <KanbanHome />
      </SpaceContextProvider>
      
  </div>
  );
};

export default Home;