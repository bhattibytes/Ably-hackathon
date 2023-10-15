import ResponsiveAppBar from '../components/ResponsiveAppBar';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import AccessDenied from '../components/AccessDenied.js';

const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });

const chat = () => {
  const { data: session, status } = useSession();

  if (typeof window !== 'undefined' && status === 'loading') return null

  if (!session && status === 'unauthenticated') { return  <AccessDenied/> }

  if (session && status === 'authenticated') {
    return (
      <div>
        <ResponsiveAppBar />
        <AblyChatComponent />
      </div>
    )
  }
};
export default chat;