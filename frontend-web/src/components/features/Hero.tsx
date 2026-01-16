"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero} id="hero">
            <div className={styles.content}>
                {/* Mascot - Positioned 4-7 cols */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 100 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 1.0, ease: "easeOut", delay: 0.5 }}
                    className={styles.imageContainer}
                >
                    <Image
                        src="/images/mascot.png"
                        alt="Hero Mascot"
                        className={styles.mascot}
                        width={520}
                        height={520}
                        priority
                    />
                </motion.div>

                {/* Logo Unit - White branding */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className={styles.logoUnit}
                >
                    <p className={styles.platformDesc}>
                        Tester, Pentester, SDET Training Platform
                    </p>
                    <h1 className={styles.brandName}>DOJO</h1>

                    {/* Staggered Phrases - Orange */}
                    <div className={styles.phrases}>
                        {['TEST ME!', 'HACK ME!', 'AUTOMATE IT!'].map((phrase, i) => (
                            <motion.span
                                key={phrase}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.4 + i * 0.2, duration: 0.5, ease: "easeOut" }}
                                className={styles.phrase}
                            >
                                {phrase}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            </div>
            <div className={styles.overlay}></div>
        </section>
    );
}
