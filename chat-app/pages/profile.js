import { useSession } from 'next-auth/react';
import styles from '../styles/Home.module.css';

export default function Profile() {
  const { data: session, status } = useSession();

  return (
    <div className={styles.profilePage}>
      <h1>My Profile</h1>
      <p>Name: <span>{session?.user?.name}</span></p>
      <p>Email: <span>{session?.user?.email}</span></p>
      <p><img src={session?.user?.image} height={150} style={{ borderRadius: "100px"}}/></p>
      <button className={styles.btn}><a className={styles.linkOut} href='/api/auth/signout'>Sign Out</a></button>
      <br/>
      <button className={styles.btn}><a className={styles.linkOut} href='/'>Back to Home</a></button>
    </div>
  )
}