import ResponsiveAppBar from '../components/ResponsiveAppBar';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic'

const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });

const chat = () => {
  const { data: session, status } = useSession();

  return (
    <div>
      <ResponsiveAppBar />
      <AblyChatComponent />
    </div>
  )
};
export default chat;