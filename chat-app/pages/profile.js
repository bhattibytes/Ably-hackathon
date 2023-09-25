import { useSession } from 'next-auth/react';

export default function Profile() {
  const { data: session, status } = useSession();

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {session?.user?.name}</p>
      <p>Email: {session?.user?.email}</p>
      <p>Image: <img src={session?.user?.image} /></p>
      <a href='/api/auth/signout'>&nbsp;Sign Out</a>
      <a href='/'>&nbsp;Back to Home</a>
    </div>
  )
}