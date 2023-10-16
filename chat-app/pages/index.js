import Head from 'next/head'
import Footer from '../components/Footer.js';
import Kanban from '../components/Kanban.js';
import ResponsiveAppBar from '../components/ResponsiveAppBar.js'; 
import styles from '../styles/Home.module.css';
import { useSession } from 'next-auth/react';
import AccessDenied from '../components/AccessDenied.js';

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
        <ResponsiveAppBar />
        <center><h1 className={styles.headlineTitle}>IMAGINE A PLACE...</h1></center>
        <center><p className={styles.summary}>...where you can seamlessly engage in real-time conversations with fellow users while simultaneously monitoring a dynamic project management dashboard. This multifunctional app offers the perfect blend of social interaction and efficient project oversight, enhancing collaboration and productivity</p></center>
        <center><p className={styles.summary}>DEMO - This app is in development - DEMO </p></center>
        
        <img className={styles.coverImg1} src={'https://images2.imgbox.com/9b/20/aEhBSWpJ_o.png'} width={600}/>
        <img className={styles.coverImg2} src={'https://images2.imgbox.com/d6/99/YXaCmfHq_o.png'} width={1000}/>
        <main className={styles.main}>
          <div className={styles.welcome}>
            <img className={styles.welcomeImg} src={session.user.image} width={75} height={75}/>
            &nbsp;&nbsp;<h1>Welcome {session.user.name.split(' ')[0]} &nbsp;
              <a className={styles.links} href='/profile'>Profile |</a>
              <a className={styles.links} href='/api/auth/signout'>&nbsp;Sign Out</a>
            </h1>
          </div>
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