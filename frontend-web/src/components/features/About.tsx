"use client";

import { motion } from 'framer-motion';
import styles from './About.module.css';
import { Linkedin, Send, Github } from 'lucide-react';

export default function About() {
    return (
        <section className={styles.about} id="about">
            <div className={`container ${styles.content}`}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className={styles.section}
                >
                    <h2>About</h2>
                    <p>This is a real, working system designed for testing practice, not a guided demo. What you can do right now:</p>
                    <ul>
                        <li>Store testing uses a fixed test user (no store registration). login: test.user@example.com pass: 123456</li>
                        <li>SDET users register separately to manage personal settings and bug tracking.</li>
                        <li>Test payment scenarios using predefined test card numbers Different card numbers trigger different checkout outcomes:
                            <ul>
                                <li>9999 9999 9999 9999 - successful</li>
                                <li>8888 8888 8888 8888 - insufficient funds</li>
                            </ul>
                        </li>
                    </ul>

                    <p>Practice UI automation on a realistic frontend. No special test-friendly markup or helper attributes are provided.</p>

                    <p>Test the system through multiple layers:</p>
                    <ul>
                        <li>Web frontend</li>
                        <li>Public API</li>
                        <li>Android application</li>
                        <li>iOS application</li>
                    </ul>

                    <p>The platform is intentionally minimal and close to real production behavior.</p>

                    <h3>Current state</h3>
                    <ul>
                        <li>At this stage, no known bugs or vulnerabilities are intentionally exposed (though new ones may appear over time — try to find them).</li>
                        <li>Arbitrary enabling or disabling of bugs is not yet available in the UI.</li>
                        <li>Validation of reported issues is not automated at this stage.</li>
                        <li>This platform evolves continuously.</li>
                        <li>If you return later, the system may behave differently.</li>
                    </ul>

                    <p><strong>What means Dojo?</strong> A dojo (道場) is a Japanese term for a hall or place for immersive learning, traditionally for martial arts like Judo, Karate, or Aikido, meaning &ldquo;place of the Way,&ldquo; emphasizing discipline and personal growth beyond just physical training.</p>

                    <p><strong>About me.</strong> Currently building a personal educational and engineering project related to software quality and testing, while remaining open to a QA / SDET Team Lead role.</p>

                    
                </motion.div>

                <footer className={styles.footer}>
                    <div className={styles.footerLeft}>
                        © 2026 Igor Gromov. Use it. Fork it. Build on it. <br/>
                        Just give credit. (MIT + CC BY 4.0)
                    </div>
                    <div className={styles.socials}>
                        <a href="#" aria-label="LinkedIn" title="LinkedIn"><Linkedin size={24} /></a>
                        <a href="#" aria-label="Telegram" title="Telegram"><Send size={24} /></a>
                        <a href="#" aria-label="GitHub" title="GitHub"><Github size={24} /></a>
                    </div>
                    <div className={styles.footerRight}>
                        AI-assisted. Human-built. Codex, Antigravity, <br/> 
                        and hands-on engineering.
                    </div>
                </footer>
            </div>
        </section>
    );
}
