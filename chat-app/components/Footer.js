import styles from '../styles/Home.module.css';

const Footer = () => {
  return (
    <center>
      <footer className={styles.footer}>
         Powered by
        <br/>
        <br/>
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
          <img src="/vercel.svg" alt="Vercel Logo" className="logo" height={20} />
        </a>
        <br/>
         and
        <br/>
        <br/>
        <a href="https://ably.com" rel="noopener noreferrer">
          <img src="/ably-logo.svg" alt="Ably Logo" className="logo ably" height={45} />
        </a>
    </footer>
  </center>
  );
};

export default Footer;