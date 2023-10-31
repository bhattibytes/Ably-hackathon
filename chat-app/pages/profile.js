import { useSession } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import ResponsiveAppBar from '../components/ResponsiveAppBar';

export default function Profile() {
  const { data: session, status } = useSession();

  return (
    <>
      <ResponsiveAppBar />
      
      <div className="h-screen mt-10 flex flex-col items-center justify-center ">
        <h1 className='text-4xl text-track-blue font-bold mb-3'>My Profile</h1>
        <p className='text-track-blue text-xl'>Name: <span className='text-black'>{session?.user?.name}</span></p>
        <p className='text-track-blue text-xl mb-5'>Email: <span className='text-black'>{session?.user?.email}</span></p>
        <p className='mb-5'><img src={session?.user?.image} height={150} style={{ borderRadius: "100px"}}/></p>
        <button className={styles.btn}><a className={styles.linkOut} href='/api/auth/signout'>Sign Out</a></button>
        <br/>
        <button className={styles.btn}><a className={styles.linkOut} href='/'>Back to Home</a></button>
      </div>
    </>
  )
}