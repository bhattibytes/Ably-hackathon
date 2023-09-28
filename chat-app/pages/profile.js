import { useSession } from 'next-auth/react';
import styles from '../styles/Home.module.css';

export default function Profile() {
  const { data: session, status } = useSession();

  return (
    <div className={styles.profilePage}>
      <h1>My Profile</h1>
      <p>Name: {session?.user?.name}</p>
      <p>Email: {session?.user?.email}</p>
      <p><img src={session?.user?.image} height={150} style={{ borderRadius: "100px"}}/></p>
      <a href='/api/auth/signout'>&nbsp;Sign Out</a> &nbsp;|&nbsp;
      <a href='/'>&nbsp;Back to Home</a>
    </div>
  )
}