import styles from './Footer.module.css';
import Link from 'next/link';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.content}`}>
                <div className={styles.info}>
                    <h3 className={styles.logo}>DOJO</h3>
                    <p className={styles.tagline}>Authentic taste, minimalist spirit.</p>
                </div>

                <div className={styles.links}>
                    <div className={styles.linkGroup}>
                        <h4>SHOP</h4>
                        <Link href="#menu">Rolls</Link>
                        <Link href="#menu">Sashimi</Link>
                        <Link href="#menu">Drinks</Link>
                    </div>
                    <div className={styles.linkGroup}>
                        <h4>COMPANY</h4>
                        <Link href="/about">About Us</Link>
                        <Link href="/locations">Locations</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                </div>

                <div className={styles.social}>
                    <Link href="#" className={styles.socialIcon}><Instagram size={20} /></Link>
                    <Link href="#" className={styles.socialIcon}><Twitter size={20} /></Link>
                    <Link href="#" className={styles.socialIcon}><Facebook size={20} /></Link>
                </div>
            </div>

            <div className={styles.bottom}>
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} DOJO Sushi. For educational purposes only.</p>
                </div>
            </div>
        </footer>
    );
}
