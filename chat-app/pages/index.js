import Head from 'next/head'
import dynamic from 'next/dynamic'
import Footer from '../components/Footer.js';
import Kanban from '../components/Kanban.js';
import styles from '../styles/Home.module.css';

const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });

export default function Home() {
  return (
    <div>
      <Head>
        <title>Ably Chat App</title>
        <link rel="icon" href="https://static.ably.dev/motif-red.svg?nextjs-vercel" type="image/svg+xml" />
      </Head>
      
      <main className={styles.main}>
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