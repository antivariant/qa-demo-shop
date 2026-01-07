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
                    <h2>About this Project</h2>
                    <p>SDTETDU / DOJO is a personal engineering showcase built as an interactive product, not a static portfolio.</p>
                    <p>The idea behind this project is simple: instead of describing skills in abstract terms, demonstrate them through a real system — with architecture, UI, automation, infrastructure, and constraints. The platform is intentionally designed as a hybrid between a product landing page, a modular store, and a technical sandbox.</p>
                    <p>Every part of this project reflects practical engineering decisions:</p>
                    <ul>
                        <li>how a frontend is structured and animated,</li>
                        <li>how layouts are translated into real markup,</li>
                        <li>how systems are tested, automated, and evolved,</li>
                        <li>how product thinking and technical depth coexist.</li>
                    </ul>
                    <p>This project is not a course platform and not a demo store. It is a living environment where ideas, experiments, and engineering approaches are validated in practice.</p>
                    <p>DOJO represents a place of discipline and continuous improvement — a space where systems are tested, broken, rebuilt, and automated. Exactly the way real engineering work happens.</p>
                </motion.div>

                <div className={styles.divider}></div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className={styles.section}
                >
                    <h2>About Me</h2>
                    <p>Hi, I’m Igor Gromov — a Software Engineer with a strong focus on Software Development in Test (SDET), backend development, penetration testing, and low-level systems.</p>
                    <p>I work at the intersection of engineering, quality, and security. My background allows me to approach systems not only from a “does it work” perspective, but from a how it fails, how it scales, and how it can be improved standpoint.</p>
                    <p>Over the years, I’ve:</p>
                    <ul>
                        <li>built and maintained automated testing frameworks and CI/CD pipelines,</li>
                        <li>worked on backend and full-stack systems,</li>
                        <li>performed security testing and vulnerability analysis,</li>
                        <li>led QA teams and defined quality strategies across multiple projects,</li>
                        <li>created and delivered technical training for engineers.</li>
                    </ul>
                    <p>Today, I’m open to opportunities where I can combine hands-on technical work with team leadership and system-level thinking — especially in roles related to QA, SDET, or engineering leadership.</p>
                    <p>This site exists to show how I think, design, and build, not just what tools I know.</p>
                </motion.div>

                <footer className={styles.footer}>
                    <div className={styles.footerLeft}>
                        Copyright © 2026 Igor Gromov
                    </div>
                    <div className={styles.socials}>
                        <a href="#"><Linkedin size={24} /></a>
                        <a href="#"><Send size={24} /></a>
                        <a href="#"><Github size={24} /></a>
                    </div>
                    <div className={styles.footerRight}>
                        Coded by Antigravity
                    </div>
                </footer>
            </div>
        </section>
    );
}
