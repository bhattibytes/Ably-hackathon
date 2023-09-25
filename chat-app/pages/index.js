import Head from 'next/head'
import dynamic from 'next/dynamic'
import Footer from '../components/Footer.js';
import Kanban from '../components/Kanban.js';
import styles from '../styles/Home.module.css';
import { useSession } from 'next-auth/react';
import AccessDenied from '../components/AccessDenied.js';

const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });

export default function Home() {
  const { data: session, status } = useSession()

  if (typeof window !== 'undefined' && status === 'loading') return null

  if (!session && status === 'unauthenticated') { return  <AccessDenied/> }

  if (session && status === 'authenticated') {
    return (
      <div>
        <Head>
          <title>Ably Chat App</title>
          <link rel="icon" href="https://static.ably.dev/motif-red.svg?nextjs-vercel" type="image/svg+xml" />
        </Head>
        
        <main className={styles.main}>
          <div className={styles.welcome}>
            <img className={styles.welcomeImg} src={session.user.image} />
            &nbsp;&nbsp;<h1>Welcome {session.user.name.split(' ')[0]} &nbsp;
              <a className={styles.links} href='/profile'>Profile |</a>
              <a className={styles.links} href='/api/auth/signout'>&nbsp;Sign Out</a>
            </h1>
          </div>
          <AblyChatComponent />
          <Kanban />
        </main>

        <Footer />
        
        <style jsx>{`
          ...       
        `}</style>

        <style jsx global>{`
          ...        
        `}</style>
      </div>
    )
  }
}