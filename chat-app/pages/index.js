import Head from 'next/head'
import Footer from '../components/Footer.js';
import Kanban from '../components/Kanban.js';
import ResponsiveAppBar from '../components/ResponsiveAppBar.js'; 
import styles from '../styles/Home.module.css';
import { useSession } from 'next-auth/react';
import AccessDenied from '../components/AccessDenied.js';
import Image from 'next/image.js';
import User from '../assets/user.png'
import Logout from '../assets/log-out.png'
import chat from '../assets/chat.png';
import project from '../assets/project.png';

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
        <div className=''>

        </div>
        <Image className="absolute bottom-32" src={chat} width={450}/>
        <Image className="absolute right-10 top-20" src={project} width={450}/>
        <div className="absolute top-[24rem] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[44%]">
        <h1 className="font-semibold text-[3rem] text-track-blue mb-4">Connect, Collaborate, and Conquer</h1>
        <p className="text-[1.5rem] text-justify font-base text-slate-600"><span className='text-track-blue font-semibold'>Instant Connection:</span> Connect instantly with your team through real-time conversations, channel creation, and private messaging. Stay in sync and foster collaborative communication effortlessly.<br/> <span className='text-track-blue font-semibold'>Effortless Collaboration:</span> TrackChat's dynamic project management dashboard simplifies project oversight. With live cursors and a locking mechanism, your team collaborates efficiently and ensures everyone works together seamlessly for successful project outcomes.</p>
        </div>
        <center></center>
        <center></center>
        
        
        <div className=''>
        <main className={styles.main}>
          <div className={styles.welcome}>
            <img className={styles.welcomeImg} src={session.user.image} width={75} height={75}/>
            &nbsp;&nbsp;<h1 className='text-xl text-white'>Welcome, <span className='font-semibold'>{session.user.name.split(' ')[0]}</span>   &nbsp;
              <a className={styles.links} href='/profile'>Profile |</a>
              <a className={styles.links} href='/api/auth/signout'>&nbsp;Signout</a>
            </h1>
          </div>
        </main>

        <Footer />

        </div>
        
        
        
      </div>
    )
  }
}