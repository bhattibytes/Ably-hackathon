import { useSession } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import ResponsiveAppBar from '../components/ResponsiveAppBar';

export default function Profile() {
  const { data: session, status } = useSession();

  return (
    <>
      <ResponsiveAppBar />
      
      <div className="h-screen mt-10 flex flex-col items-center justify-center ">
        <h1 className='text-[4rem] text-track-blue font-bold mb-6'>My Profile</h1>
        <p className='text-track-blue text-[2rem]'>Name: <span className='text-black'>{session?.user?.name}</span></p>
        <p className='text-track-blue text-[2rem] mb-5'>Email: <span className='text-black'>{session?.user?.email}</span></p>
        <p className='mb-5'><img src={session?.user?.image} className='h-24' height={250} style={{ borderRadius: "100px"}}/></p>
        <button className={styles.btn}><a className={styles.linkOut} href='/api/auth/signout'>Sign Out</a></button>
        <br/>
        <button className={styles.btn}><a className={styles.linkOut} href='/'>Back to Home</a></button>
      </div>
    </>
  )
}